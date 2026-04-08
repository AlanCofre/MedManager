// controllers/perfil.controller.js
import db from "../config/db.js";
import { validarPerfilPayload } from "../src/utils/validaciones_perfil.js"; // valida email_alt, numero_telef, direccion, foto_url
// Nota: este controlador usa SQL plano contra tablas: usuario, perfil

function _buildPerfilFromRow(row) {
  return {
    email_alt: row.email_alt ?? null,
    numero_telef: row.numero_telef ?? null,
    direccion: row.direccion ?? null,
    foto_url: row.foto_url ?? null,
  };
}

// GET /api/perfil/me
export async function obtenerMiPerfil(req, res) {
  try {
    const id = req.user.id_usuario; // viene de requireAuth
    const [rows] = await db.execute(
      `SELECT 
          u.id_usuario,
          u.nombre,
          u.correo_usuario AS correoInstitucional,
          u.activo,
          u.id_rol,
          p.email_alt,
          p.numero_telef,
          p.direccion,
          p.foto_url
       FROM usuario u
       LEFT JOIN perfil p ON p.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const u = rows[0];
    return res.json({
      ok: true,
      data: {
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        correoInstitucional: u.correoInstitucional,
        activo: u.activo,
        id_rol: u.id_rol,
        perfil: _buildPerfilFromRow(u),
      },
    });
  } catch (e) {
    console.error("[obtenerMiPerfil]", e);
    return res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
}

// PUT /api/perfil/me
export async function guardarMiPerfil(req, res) {
  try {
    const id_usuario = req.user?.id_usuario;
    if (!id_usuario) return res.status(401).json({ ok: false, mensaje: 'No autenticado' });

    // viene por JSON desde el FE (paso 2)
    const {
      email_alt = null,
      numero_telef = null,
      direccion = null,
      foto_url = null, // si no hay nueva foto, vendrá null
    } = req.body || {};

    // UPSERT por id_usuario
    const sql = `
      INSERT INTO perfil (id_usuario, email_alt, numero_telef, direccion, foto_url)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email_alt    = VALUES(email_alt),
        numero_telef = VALUES(numero_telef),
        direccion    = VALUES(direccion),
        -- si foto_url viene null, conserva la anterior
        foto_url     = COALESCE(VALUES(foto_url), foto_url)
    `;
    const params = [id_usuario, email_alt, numero_telef, direccion, foto_url];
    await db.execute(sql, params);

    // 🔔 Insertar notificación
    await db.execute(
      `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
       VALUES (?, ?, 0, NOW(), ?)`,
      [
        'Actualización de perfil',
        'Tu perfil ha sido actualizado correctamente.',
        id_usuario
      ]
    );

    // devuelve el perfil actualizado
    const [rows] = await db.execute(
      `SELECT id_perfil, id_usuario, email_alt, numero_telef, direccion, foto_url
       FROM perfil WHERE id_usuario = ? LIMIT 1`,
      [id_usuario]
    );

    // 🧾 Auditoría: actualización de perfil
    try {
      await req.audit('actualizar cuenta', 'usuario', {
        id_usuario,
        campos_modificados: Object.keys(req.body || {}),
        rol: req.user?.rol ?? null
      })
    } catch (e) {
      console.warn('[audit] actualizarPerfil:', e?.message || e)
    }

    return res.json({ ok: true, data: rows[0] || null });
  } catch (err) {
    console.error('[perfil] Error guardarMiPerfil:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error guardando perfil', detalle: err.message });
  }
}

// GET /api/perfil/usuario/:id_usuario
export async function obtenerPerfilPorUsuario(req, res) {
  try {
    const { id_usuario } = req.params;
    const [rows] = await db.execute(
      `SELECT 
          u.id_usuario,
          u.nombre,
          u.correo_usuario AS correoInstitucional,
          u.activo,
          u.id_rol,
          p.email_alt,
          p.numero_telef,
          p.direccion,
          p.foto_url
       FROM usuario u
       LEFT JOIN perfil p ON p.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const u = rows[0];
    return res.json({
      ok: true,
      data: {
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        correoInstitucional: u.correoInstitucional,
        activo: u.activo,
        id_rol: u.id_rol,
        perfil: _buildPerfilFromRow(u),
      },
    });
  } catch (e) {
    console.error("[obtenerPerfilPorUsuario]", e);
    return res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
}

export const NotificacionesPassword = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [notificaciones] = await db.execute(
      'SELECT id_notificacion, asunto, contenido, fecha_envio FROM notificacion WHERE id_usuario = ? AND asunto = ? ORDER BY fecha_envio DESC',
      [id_usuario, 'Cambio de contraseña']
    );

    console.log('🔐 Notificaciones de cambio de contraseña:', notificaciones);

    res.json({ ok: true, mensaje: 'Notificaciones de contraseña mostradas en terminal' });
  } catch (e) {
    console.error('❌ Error al obtener notificaciones de contraseña:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};

export const NotificacionesPerfil = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [notificaciones] = await db.execute(
      'SELECT id_notificacion, asunto, contenido, fecha_envio FROM notificacion WHERE id_usuario = ? AND asunto = ? ORDER BY fecha_envio DESC',
      [id_usuario, 'Actualización de perfil']
    );

    console.log('👤 Notificaciones de modificación de perfil:', notificaciones);

    res.json({ ok: true, mensaje: 'Notificaciones de perfil mostradas en terminal' });
  } catch (e) {
    console.error('❌ Error al obtener notificaciones de perfil:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};
