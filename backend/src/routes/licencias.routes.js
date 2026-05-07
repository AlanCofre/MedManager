// backend/src/routes/licencias.routes.js
import { Router } from 'express';
import multer from 'multer';
import db from '../../config/db.js';
import {
  crearLicencia,
  listarLicencias,
  decidirLicencia,
  getLicenciasEnRevision,
  detalleLicencia,
  descargarArchivoLicencia,
  licenciasResueltas,
  listarMisLicencias,
} from '../../controllers/licencias.controller.js';

import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
// import { cambiarEstado } from '../../controllers/licencias.controller.js';
import { authRequired } from '../../middlewares/requireAuth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateDecision } from '../../middlewares/validateDecision.js';
import {
  validateLicenciaBody,
  validarArchivoAdjunto,
  validarTransicionEstado,
  normalizaEstado,
} from '../../middlewares/validarLicenciaMedica.js';
import { decidirLicenciaSvc } from '../../services/servicio_Licencias.js';

import { LicenciasEntregas, Curso, Usuario, LicenciaMedica, Matricula } from '../models/index.js';

import { cacheMiddleware } from '../../middlewares/cacheMiddleware.js';
import { getLicenciasEstudianteConRegularidad } from '../../controllers/licencias.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function cargarLicencia(req, res, next) {
  try {
    const lic = await LicenciaMedica.findByPk(req.params.id);
    if (!lic) return res.status(404).json({ ok: false, error: 'Licencia no encontrada' });
    req.licencia = lic;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error al obtener licencia' });
  }
}

/* ===== Listados / creación ===== */
router.get('/', validarJWT, listarLicencias);

// Reemplazada: única ruta unificada para /en-revision (filtros, paginación y regularidad)
router.get('/en-revision', validarJWT, async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    // Solo ciertos roles pueden ver licencias en revisión
    if (!['funcionario', 'secretario', 'profesor'].includes(rol)) {
      return res.status(403).json({
        ok: false,
        error: 'No tiene permisos para ver licencias en revisión'
      });
    }

    const { nombre, folio, desde, hasta, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [`l.estado = 'pendiente'`];
    let params = [];

    if (nombre) {
      condiciones.push(`u.nombre LIKE ?`);
      params.push(`%${nombre}%`);
    }
    if (folio) {
      condiciones.push(`l.folio LIKE ?`);
      params.push(`%${folio}%`);
    }
    if (desde) {
      condiciones.push(`l.fecha_emision >= ?`);
      params.push(desde);
    }
    if (hasta) {
      condiciones.push(`l.fecha_emision <= ?`);
      params.push(hasta);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Consulta principal con información de regularidad (total_licencias_activas)
    const [rows] = await db.execute(
      `SELECT 
        l.id_licencia,
        l.folio,
        l.fecha_emision,
        l.fecha_inicio,
        l.fecha_fin,
        l.estado,
        l.motivo_rechazo,
        l.fecha_creacion,
        l.id_usuario,
        u.nombre as estudiante_nombre,
        u.correo_usuario as estudiante_email,
        (
          SELECT COUNT(*) 
          FROM licenciamedica lm2 
          WHERE lm2.id_usuario = l.id_usuario 
            AND lm2.estado = 'aceptado'
            AND CURDATE() BETWEEN lm2.fecha_inicio AND lm2.fecha_fin
        ) as total_licencias_activas
      FROM licenciamedica l
      JOIN usuario u ON l.id_usuario = u.id_usuario
      ${where}
      ORDER BY l.fecha_creacion DESC
      LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    // Enriquecer con categoría de regularidad
    const licenciasEnriquecidas = rows.map(licencia => {
      let categoria_regularidad = 'Alta regularidad';
      if (licencia.total_licencias_activas >= 6) {
        categoria_regularidad = 'Baja regularidad';
      } else if (licencia.total_licencias_activas >= 3) {
        categoria_regularidad = 'Media regularidad';
      }

      return {
        ...licencia,
        categoria_regularidad
      };
    });

    // Contar total
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total
       FROM licenciamedica l
       JOIN usuario u ON l.id_usuario = u.id_usuario
       ${where}`,
      params
    );

    const total = countRows[0]?.total || 0;

    return res.status(200).json({
      ok: true,
      data: licenciasEnriquecidas,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(total),
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('❌ Error en GET /en-revision:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al obtener licencias en revisión'
    });
  }
});


/* === Licencias del estudiante autenticado === */
router.get(
  '/mis-licencias',
  validarJWT,
  esEstudiante,
  cacheMiddleware((req) => {
    const idUsuario =
      req.user?.id_usuario ??
      req.user?.id ??
      req.id ??
      req.user?.sub ??
      null;
    return idUsuario ? `mis-licencias:${idUsuario}` : null;
  }),
  listarMisLicencias,
  async (req, res) => {
    try {
      // Acepta todas las variantes posibles que puede dejar tu middleware:
      const idUsuario =
        req.user?.id_usuario ??
        req.user?.id ??
        req.id ??
        req.user?.sub ??
        null;

      // Si no viene, es problema de autenticación → 401
      if (!idUsuario) {
        return res.status(401).json({ ok: false, error: 'No autenticado' });
      }

      const [rows] = await db.execute(
        `
        SELECT
          id_licencia           AS id,
          folio,
          DATE_FORMAT(fecha_emision, '%Y-%m-%d') AS fecha_emision,
          DATE_FORMAT(fecha_inicio,  '%Y-%m-%d') AS fecha_inicio,
          DATE_FORMAT(fecha_fin,     '%Y-%m-%d') AS fecha_fin,
          estado,
          motivo_rechazo,
          DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fecha_creacion
        FROM licenciamedica
        WHERE id_usuario = ?
        ORDER BY fecha_creacion DESC
        `,
        [idUsuario]
      );

      // Devuelve OK con arreglo (aunque esté vacío)
      return res.status(200).json({ ok: true, data: rows });
    } catch (error) {
      console.error('❌ Error en GET /mis-licencias:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error interno al obtener licencias del estudiante',
      });
    }
  });

/**
 * Detalle de licencia (shape compatible con el FE)
 */
router.get('/detalle/:id', validarJWT, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const [rows] = await db.execute(
      `
      SELECT
        l.id_licencia,
        l.folio,
        l.fecha_emision,
        l.fecha_inicio,
        l.fecha_fin,
        l.estado,
        l.motivo_rechazo,
        l.fecha_creacion,
        l.id_usuario,

        u.id_usuario      AS usuario_id,
        u.nombre          AS nombre,           -- ← Cambiado: directamente "nombre"
        u.correo_usuario  AS correo_usuario,   -- ← Cambiado: directamente "correo_usuario"
        NULL              AS usuario_facultad
      FROM licenciamedica l
      LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
      WHERE l.id_licencia = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    const r = rows[0];
    const licencia = {
      id_licencia: r.id_licencia,
      folio: r.folio,
      fecha_emision: r.fecha_emision,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      estado: r.estado,
      motivo_rechazo: r.motivo_rechazo,
      fecha_creacion: r.fecha_creacion,
      id_usuario: r.id_usuario,
      // ↓↓↓ ENVIAR DIRECTAMENTE EN EL OBJETO PRINCIPAL ↓↓↓
      nombre: r.nombre,                    // ← Campo directo
      correo_usuario: r.correo_usuario,    // ← Campo directo
      usuario: r.usuario_id ? {
        id_usuario: r.usuario_id,
        nombre: r.nombre,
        facultad: r.usuario_facultad,
        email: r.correo_usuario,
      } : null,
      archivo: null,
    };

    try {
      const [archs] = await db.execute(
        `
        SELECT
          id_archivo,
          ruta_url,
          tipo_mime,
          hash,
          tamano,
          fecha_subida
        FROM archivolicencia
        WHERE id_licencia = ?
        ORDER BY id_archivo DESC
        LIMIT 1
        `,
        [id]
      );

      if (Array.isArray(archs) && archs.length > 0) {
        const a = archs[0];
        licencia.archivo = {
          id_archivo: a.id_archivo,
          nombre_archivo: 'licencia.pdf',
          ruta_url: a.ruta_url,
          mimetype: a.tipo_mime,
          hash: a.hash,
          tamano: a.tamano,
          fecha_subida: a.fecha_subida,
        };
      }
    } catch (errArchivo) {
      console.warn('Detalle: no se pudo obtener archivo (se omite):', errArchivo?.message);
    }

    return res.json({ ok: true, licencia });
  } catch (error) {
    console.error('❌ Error en GET /detalle/:id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// (ruta duplicada eliminada: use router.get('/:id/archivo') más abajo)

// Profesor o Secretario (demo simple)
router.get('/revisar', [validarJWT, tieneRol('profesor', 'funcionario', 'secretario')], (req, res) => {
  res.json({ ok: true, msg: 'Revisando licencias...', rol: req.rol });
});

/**
 * Decidir licencia (SECRETARIO):
 * - validateDecision: valida body (ej. { estado, motivo_rechazo })
 * - cargarLicencia: trae la licencia y la deja en req.licencia
 * - validarTransicionEstado: aplica la regla de transición usando el estado actual
 *   pendiente → (aceptado|rechazado) ✅; otras ❌
 */


// backend/src/routes/licencias.routes.js

// En la ruta GET /mis-cursos
router.get('/mis-cursos', validarJWT, tieneRol('profesor'), async (req, res) => {
  const { periodo } = req.query;
  const idProfesor = req.user?.id_usuario;

  try {
    if (!idProfesor) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    if (!periodo) {
      return res.status(400).json({
        ok: false,
        error: 'Debe indicar el código de período (?periodo=2025-1, por ejemplo)',
      });
    }

    const [rows] = await db.execute(
      `
      SELECT 
        lm.id_licencia,
        lm.id_usuario              AS id_estudiante,
        lm.folio,
        lm.fecha_emision,
        lm.fecha_inicio,
        lm.fecha_fin,
        lm.estado,
        lm.motivo_rechazo,
        lm.fecha_creacion,         -- 👈 la usamos como "fecha_envio"

        u.nombre          AS nombre_estudiante,
        u.correo_usuario  AS correo_estudiante,

        c.id_curso,
        c.nombre_curso,
        c.seccion,

        p.id_periodo,
        p.codigo          AS periodo_codigo
      FROM licenciamedica lm
      JOIN licencias_entregas   le ON lm.id_licencia = le.id_licencia
      JOIN curso                c  ON le.id_curso     = c.id_curso
      JOIN periodos_academicos  p  ON c.id_periodo    = p.id_periodo
      JOIN usuario              u  ON lm.id_usuario   = u.id_usuario
      WHERE c.id_usuario = ?      -- profesor dueño del curso
        AND p.codigo    = ?       -- período filtrado
      ORDER BY lm.fecha_creacion DESC
      `,
      [idProfesor, periodo]
    );

    const data = rows.map((r) => ({
      id_licencia:   r.id_licencia,
      estado:        r.estado,
      fecha_envio:   r.fecha_creacion,
      fecha_inicio:  r.fecha_inicio,
      fecha_fin:     r.fecha_fin,
      folio:         r.folio,

      estudiante: {
        id:     r.id_estudiante,
        nombre: r.nombre_estudiante,
        correo: r.correo_estudiante,
      },
      curso: {
        id:             r.id_curso,
        nombre:         r.nombre_curso,
        seccion:        r.seccion,
        periodo_codigo: r.periodo_codigo,
      },
    }));

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error('❌ Error al obtener licencias del profesor:', error);
    return res
      .status(500)
      .json({ ok: false, error: 'Error interno del servidor' });
  }
});

router.put(
  '/:id/estado',
  validarJWT,
  tieneRol(['funcionario']),
  // cambiarEstado
);

router.post(
  '/:id/decidir',
  validarJWT,
  tieneRol(['funcionario']),
  // 🔧 inject id_usuario for validateDecision
  (req, _res, next) => {
    req.body ||= {};
    if (!req.body.id_usuario) req.body.id_usuario = req.user?.id_usuario ?? req.user?.id ?? null;
    // tolerancia a "estado" o "decision"
    if (req.body.estado && !req.body.decision) req.body.decision = req.body.estado;
    next();
  },
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  (req, _res, next) => {
    if (req.body?.estado) req.body.estado = normalizaEstado(req.body.estado);
    if (req.body?.decision) req.body.decision = normalizaEstado(req.body.decision);
    next();
  },
  decidirLicencia
);

router.put(
  '/:id/notificar',
  validarJWT,
  tieneRol(['funcionario']),
  // 🔧 inject id_usuario también aquí por si el middleware lo necesita
  (req, _res, next) => {
    req.body ||= {};
    if (!req.body.id_usuario) req.body.id_usuario = req.user?.id_usuario ?? req.user?.id ?? null;
    next();
  },
  validateDecision,
  async (req, res) => {
    try {
      const idLicencia = Number(req.params.id);
      const { estado, motivo_rechazo, observacion, fecha_inicio, fecha_fin } = req.body;
      const actorId = req.user?.id_usuario ?? null;

      const resultado = await decidirLicenciaSvc({
        idLicencia,
        estado,
        motivo_rechazo,
        observacion,
        _fi: fecha_inicio,
        _ff: fecha_fin,
        idFuncionario: actorId,
        ip: req.ip 
      });

      return res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
      console.error('❌ Error en /notificar:', error);
      return res.status(error.http ?? 500).json({ ok: false, error: error.message });
    }
  }
);

/**
 * Licencias resueltas (aceptadas/rechazadas) con datos del usuario (LEFT JOIN).
 */
router.get('/resueltas', validarJWT, async (req, res) => {
  try {
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    
    // Solo funcionarios pueden ver el historial completo
    if (rol !== 'funcionario') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Solo los funcionarios pueden ver el historial de licencias resueltas.' 
      });
    }

    const { estado, desde, hasta, nombre, folio, page = 1, limit = 20 } = req.query;
    
    // Validar parámetros
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [`l.estado IN ('aceptado', 'rechazado')`];
    let valores = [];

    if (estado && ['aceptado', 'rechazado'].includes(estado)) { 
      condiciones.push(`l.estado = ?`); 
      valores.push(estado); 
    }
    if (nombre) { 
      condiciones.push(`u.nombre LIKE ?`); 
      valores.push(`%${nombre}%`); 
    }
    if (folio) { 
      condiciones.push(`l.folio LIKE ?`); 
      valores.push(`%${folio}%`); 
    }
    if (desde) { 
      condiciones.push(`l.fecha_emision >= ?`); 
      valores.push(desde); 
    }
    if (hasta) { 
      condiciones.push(`l.fecha_emision <= ?`); 
      valores.push(hasta); 
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Consulta principal
    const [rows] = await db.execute(
      `SELECT
        l.id_licencia,
        l.folio,
        l.fecha_emision,
        l.fecha_inicio,
        l.fecha_fin,
        l.estado,
        l.motivo_rechazo,
        l.fecha_creacion,
        l.id_usuario,
        u.nombre as estudiante_nombre,
        u.correo_usuario as estudiante_email
      FROM licenciamedica l
      JOIN usuario u ON l.id_usuario = u.id_usuario
      ${where}
      ORDER BY l.fecha_creacion DESC
      LIMIT ? OFFSET ?`,
      [...valores, limitNum, offset]
    );

    // Contar total
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total
       FROM licenciamedica l
       JOIN usuario u ON l.id_usuario = u.id_usuario
       ${where}`,
      valores
    );

    const total = countRows[0]?.total || 0;

    return res.status(200).json({
      ok: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(total),
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /resueltas:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor al obtener licencias resueltas' 
    });
  }
});


/* ===== Rutas con :id ===== */
router.get('/:id', validarJWT, detalleLicencia);
router.get('/:id/archivo', validarJWT, descargarArchivoLicencia);

router.post(
  '/:id/rechazar',
  validarJWT,
  tieneRol('funcionario','secretario'),
  (req, _res, next) => { req.body = { ...(req.body || {}), decision: 'rechazado' }; next(); },
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  decidirLicencia
);

router.post(
  '/crear',
  validarJWT,
  esEstudiante,
  upload.single('archivo'),
  validarArchivoAdjunto,
  validateLicenciaBody,
  crearLicencia
);

// Nueva ruta para licencias de estudiante con regularidad (para profesores/admin)
router.get(
  '/estudiante/:idEstudiante/consulta',
  validarJWT,
  tieneRol('profesor', 'administrador', 'funcionario'),
  getLicenciasEstudianteConRegularidad
);

export default router;