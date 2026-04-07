// backend/controllers/controlador_Usuario.js
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import UsuarioService from '../services/servicio_Usuario.js'

// === Paths para servir HTML de /frontend/public ===
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'frontend', 'public')

// ======== Vistas simples (opcional) ========
export const mostrarLogin = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'login.html'))
}

export const mostrarRegistro = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'registro.html'))
}

export const mostrarIndex = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'index.html'))
}

// ======== Registro de usuario ========
export async function registrar(req, res) {
  try {
    const b = req.body || {}

    // Normalizar posibles nombres que pueda mandar el FE
    const nombre =
      b.nombre ?? b.name ?? b.nombre_completo ?? b.fullname ?? null

    const correo_usuario =
      b.correo_usuario ?? b.correo ?? b.email ?? b.username ?? null

    const contrasena =
      b.contrasena ?? b.password ?? b.pass ?? b.pwd ?? null

    // Rol por defecto: estudiante (ID 2) – ajusta según tu BD
    const roleId = Number.isInteger(b.idRol) ? b.idRol : 2

    // Validación mínima
    if (!nombre || !correo_usuario || !contrasena) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos requeridos: nombre, correo_usuario y contrasena',
        body_recibido: Object.keys(b)
      })
    }

    const usuario = await UsuarioService.registrar(
      nombre,
      correo_usuario,
      contrasena,
      roleId
    )

    // 🔎 AUDITORÍA: crear cuenta
    try {
      await req.audit('crear cuenta', 'usuario', {
        id_usuario: usuario?.id_usuario ?? usuario?.id ?? null,
        email: correo_usuario,
        rol: roleId === 2 ? 'estudiante' : `rol_${roleId}`
      })
    } catch (e) {
      console.warn('[audit] registrar:', e?.message || e)
    }

    return res.status(201).json({ ok: true, mensaje: 'Usuario registrado', usuario })
  } catch (err) {
    console.error('[registrar] error:', err)
    return res.status(400).json({ ok: false, error: err.message || 'Error al registrar' })
  }
}

// ======== Login (emite JWT con { id, rol, nombre, correo_usuario }) ========
export async function login(req, res) {
  try {
    const body = req.body || {}

    // Acepta varios nombres de campo por compatibilidad
    const correoIn =
      body.correo_usuario ||
      body.correo ||
      body.email ||
      body.username ||
      body.user
    const contrasena =
      body.contrasena || body.password || body.pass || body.pwd

    if (!correoIn || !contrasena) {
      return res.status(400).json({ ok: false, msg: 'correo y contrasena son requeridos' })
    }

    // Autenticación
    const usuario = await UsuarioService.login(correoIn, contrasena)
    if (!usuario) {
      return res.status(401).json({ ok: false, msg: 'Credenciales inválidas' })
    }

    // Normalizar propiedades retornadas por el servicio
    const id = usuario.id ?? usuario.id_usuario ?? usuario.idUsuario ?? usuario.userId
    const rol =
      usuario.rol ?? usuario.id_rol ?? usuario.role ?? usuario.roleId ?? usuario.idRol
    const correo_usuario =
      usuario.correo_usuario ?? usuario.correo ?? usuario.email ?? usuario.username
    const nombre =
      usuario.nombre ?? usuario.nombre_completo ?? usuario.name ?? usuario.fullname

    if (!id) {
      console.error('[login] usuario retornado sin id:', usuario)
      return res.status(500).json({ ok: false, msg: 'Error interno: usuario inválido' })
    }

    const secret = process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME'
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d'

    // === 🔹 CAMBIO IMPORTANTE ===
    // Incluimos nombre y correo_usuario en el token para que el frontend pueda mostrarlo en el NavBar.
    const token = jwt.sign({ id, rol, nombre, correo_usuario }, secret, { expiresIn })

    const usuarioSafe = {
      id_usuario: id,
      correo_usuario,
      nombre,
      id_rol: rol
    }

    // Respuesta al frontend
    return res.json({
      ok: true,
      mensaje: 'Login exitoso',
      usuario: usuarioSafe,
      token
    })
  } catch (err) {
    console.error('[login] error:', err)
    const msg = err?.message || 'Credenciales inválidas'
    return res.status(401).json({ ok: false, msg })
  }
}

// ======== Página de ejemplo ========
export const index = (_req, res) => {
  res.send(`
    <h1>Licencias — Demo JWT</h1>
    <p>Usa Thunder Client/Postman para probar:</p>
    <ul>
      <li>POST /usuarios/login</li>
      <li>GET  /api/licencias/mis-licencias (con Authorization: Bearer ...)</li>
      <li>POST /api/licencias/crear (sólo estudiante)</li>
      <li>GET  /api/licencias/revisar (profesor o secretario)</li>
    </ul>
  `)
}

// ======== Logout (opcional) ========
export const logout = (req, res) => {
  try {
    if (req.session) req.session.destroy(() => {})
    res.clearCookie?.('token')
  } finally {
    return res.redirect('/usuarios/login')
  }
}
