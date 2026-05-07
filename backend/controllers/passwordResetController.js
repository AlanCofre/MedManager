// src/controllers/passwordResetController.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../config/db.js'; // mysql2/promise pool
import { generateRecoveryCode } from "../utils/Codigoverificacion.js";
import { enviarCodigoRecuperacion } from "../services/servicio_Correo.js";


const TTL_MIN = Number(process.env.RESET_CODE_TTL_MIN || 10) // minutos
const MAX_ATTEMPTS = Number(process.env.RESET_MAX_ATTEMPTS || 5)

const NEUTRAL_MSG =
  'Si la dirección existe, enviaremos instrucciones para restablecer la contraseña.'

// ===== Almacenamiento en memoria (solo DEV/LOCAL) =====
const resetStore = new Map()

function generateNumericCode(len = 6) {
  const n = crypto.randomInt(0, 10 ** len)
  return n.toString().padStart(len, '0')
}

/** Limpia entradas expiradas periódicamente (opcional) */
setInterval(() => {
  const now = Date.now()
  for (const [email, entry] of resetStore.entries()) {
    if (entry.used || entry.expiresAt.getTime() <= now) {
      resetStore.delete(email)
    }
  }
}, 60 * 1000) // cada 60s

// POST /usuarios/password-reset/request  { email }
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ message: 'Faltan datos.' })

  try {
    const [rows] = await db.execute(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ? LIMIT 1',
      [email]
    )

    if (!rows.length) {
      // 🔎 Auditar también el intento para un correo inexistente
      try {
        await req.audit('recuperar contraseña', 'autenticación', {
          email,
          resultado: 'email_inexistente'
        })
      } catch (e) {
        console.warn('[audit] password-reset/request (no existe):', e?.message || e)
      }
      // Respuesta neutral o 404 (tu flujo usaba 404, lo mantengo)
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const id_usuario = rows[0].id_usuario

    const code = generateRecoveryCode() // código visible para el usuario
    const expiresAt = new Date(Date.now() + TTL_MIN * 60000)

    // 🔐 Guardamos hash en memoria
    const codeHash = await bcrypt.hash(code, 10)
    resetStore.set(email, {
      codeHash,
      expiresAt,
      attempts: 0,
      used: false
    })

    // ✅ Auditar solicitud EXITOSA de código
    try {
      await req.audit('recuperar contraseña', 'autenticación', {
        email,
        id_usuario,
        resultado: 'token_enviado'
      })
    } catch (e) {
      console.warn('[audit] password-reset/request:', e?.message || e)
    }

    console.log(`🔐 Código generado para ${email}: ${code}`)

    const enviado = await enviarCodigoRecuperacion(email, code)

    return res.json({
      message: enviado
        ? 'Correo enviado correctamente.'
        : 'No se pudo enviar el correo, pero el código se generó.',
      // 👇 Deja "code" solo si estás en DEV
      // code,
      email
    })
  } catch (error) {
    console.error('❌ Error al enviar código:', error)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// POST /usuarios/password-reset/confirm  { email, code, newPassword }
export const confirmPasswordReset = async (req, res) => {
  const { email, code, newPassword } = req.body || {}
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos.' })
  }

  try {
    const [u] = await db.execute(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ? LIMIT 1',
      [email]
    )

    if (!u.length) {
      // Auditar intento de confirmación para email inexistente (neutral)
      try {
        await req.audit('recuperar contraseña', 'Usuario', {
          mensaje: 'Intento de confirmación con email no encontrado',
          email,
          resultado: 'email_inexistente'
        })
      } catch (e) {
        console.warn('[audit] password-reset/confirm (no existe):', e?.message || e)
      }
      return res.status(200).json({ message: NEUTRAL_MSG })
    }

    const { id_usuario } = u[0]

    const entry = resetStore.get(email)
    if (!entry || entry.used || entry.expiresAt.getTime() <= Date.now()) {
      // Auditar código inválido/expirado
      try {
        await req.audit('recuperar contraseña', 'autenticación', {
          email,
          id_usuario,
          resultado: 'codigo_invalido_o_expirado'
        })
      } catch (e) {
        console.warn('[audit] password-reset/confirm (inválido/expirado):', e?.message || e)
      }
      return res.status(400).json({ message: 'Código inválido o expirado.' })
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      // Auditar demasiados intentos
      try {
        await req.audit('recuperar contraseña', 'autenticación', {
          email,
          id_usuario,
          intentos: entry.attempts,
          resultado: 'max_intentos'
        })
      } catch (e) {
        console.warn('[audit] password-reset/confirm (max_intentos):', e?.message || e)
      }
      return res
        .status(429)
        .json({ message: 'Demasiados intentos. Solicita un nuevo código.' })
    }

    const ok = await bcrypt.compare(code, entry.codeHash)
    if (!ok) {
      entry.attempts += 1
      resetStore.set(email, entry)

      // Auditar código incorrecto
      try {
        await req.audit('recuperar contraseña', 'autenticación', {
          email,
          id_usuario,
          intentos: entry.attempts,
          resultado: 'codigo_incorrecto'
        })
      } catch (e) {
        console.warn('[audit] password-reset/confirm (codigo_incorrecto):', e?.message || e)
      }

      return res.status(400).json({ message: 'Código inválido o expirado.' })
    }

    // Código correcto → actualizar contraseña
    const newHash = await bcrypt.hash(newPassword, 10)

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      await conn.execute(
        'UPDATE usuario SET contrasena = ? WHERE id_usuario = ?',
        [newHash, id_usuario]
      )

      // 🔔 Insertar notificación
      await conn.execute(
        `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
        VALUES (?, ?, 0, NOW(), ?)`,
        [
          'Cambio de contraseña',
          'Tu contraseña ha sido actualizada correctamente.',
          id_usuario
        ]
      )
      console.log(`🔔 Notificación creada para usuario ${id_usuario}: Cambio de contraseña - Tu contraseña ha sido actualizada correctamente.`)
      await conn.commit()

      // Marcar usado y limpiar
      entry.used = true
      resetStore.delete(email)

      // ✅ Auditar éxito de restablecimiento
      try {
        await req.audit('recuperar contraseña', 'autenticación', {
          email,
          id_usuario,
          resultado: 'ok'
        })
      } catch (e) {
        console.warn('[audit] password-reset/confirm:', e?.message || e)
      }

      return res
        .status(200)
        .json({ message: 'La contraseña se ha actualizado correctamente.' })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (e) {
    console.error('[password-reset/confirm] ERROR:', e)
    return res.status(500).json({ message: 'Error interno' })
  }
}

export const sendPasswordResetCode = async (req, res) => {
  const { email } = req.body

  try {
    const [rows] = await db.execute(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ? LIMIT 1',
      [email]
    )
    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const code = generateRecoveryCode()
    const expiresAt = new Date(Date.now() + Number(process.env.RESET_CODE_TTL_MIN || 10) * 60000)

    console.log(`🔐 Código generado para ${email}: ${code}`)

    const enviado = await enviarCodigoRecuperacion(email, code)

    if (!enviado) {
      return res.status(500).json({
        message: 'No se pudo enviar el correo. Verifica la consola para ver el código.',
        // code,
      })
    }

    return res.json({ message: 'Correo enviado correctamente.', email })
  } catch (error) {
    console.error('❌ Error al enviar código:', error)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}