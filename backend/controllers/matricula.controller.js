// backend/controllers/matricula.controller.js
import db from '../config/db.js';

// helper simple de respuestas
function ok(res, data, mensaje = 'OK') {
  return res.status(200).json({ ok: true, mensaje, data });
}

function fail(res, mensaje = 'Error en la solicitud', status = 400, extra = {}) {
  return res.status(status).json({ ok: false, mensaje, ...extra });
}

export const buscarEstudiantesPorEmail = async (req, res) => {
  try {
    const emailRaw = (req.query.email || '').trim().toLowerCase();

    if (!emailRaw) {
      // Para el UI conviene no reventar, solo devolver vacío
      return ok(res, [], 'Búsqueda vacía, sin resultados');
    }

    // No validar formato estricto, permitir búsqueda por nombre o email parcial

    // Solo estudiantes (id_rol = 2) y match parcial por correo o nombre
    const [rows] = await db.execute(
      `SELECT 
         u.id_usuario,
         u.nombre,
         u.correo_usuario,
         u.id_rol
       FROM usuario u
       WHERE (LOWER(u.correo_usuario) LIKE ? OR LOWER(u.nombre) LIKE ?)
         AND u.id_rol = 2
       LIMIT 10`,
      [`%${emailRaw}%`, `%${emailRaw}%`]
    );

    // No tiramos 404: devolvemos [] para que el frontend muestre "sin resultados"
    return ok(res, rows, rows.length ? `${rows.length} estudiante(s) encontrado(s)` : 'Sin resultados');
  } catch (error) {
    console.error('[matriculas] buscarEstudiantesPorEmail error:', error);
    return fail(res, 'Error interno al buscar estudiante por email', 500);
  }
};

/**
 * 1) ESTUDIANTE: obtener mis matrículas
 */
export const obtenerMisMatriculas = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario || req.user?.id;
    const { periodo, flat } = req.query;

    if (!usuarioId) {
      return fail(res, 'No autenticado', 401);
    }

    // Verificar que el usuario existe y es estudiante
    const [usuarios] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.correo_usuario, u.id_rol, r.nombre_rol 
       FROM usuario u 
       JOIN rol r ON u.id_rol = r.id_rol 
       WHERE u.id_usuario = ?`,
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return fail(res, 'Usuario no encontrado', 404);
    }

    const usuario = usuarios[0];

    // solo estudiantes (id_rol = 2 en tu BD)
    if (usuario.id_rol !== 2) {
      return fail(res, 'Solo estudiantes pueden acceder a esta información', 403);
    }

    // Construir la consulta base
    let query = `
      SELECT 
        m.id_matricula,
        m.fecha_matricula,
        c.id_curso,
        c.codigo,
        c.nombre_curso,
        c.seccion,
        c.semestre,
        c.id_periodo,
        p.codigo as periodo_codigo,
        p.activo as periodo_activo,
        u_profesor.id_usuario as profesor_id,
        u_profesor.nombre as profesor_nombre,
        u_profesor.correo_usuario as profesor_correo
      FROM matriculas m
      JOIN curso c ON m.id_curso = c.id_curso
      JOIN periodos_academicos p ON c.id_periodo = p.id_periodo
      JOIN usuario u_profesor ON c.id_usuario = u_profesor.id_usuario
      WHERE m.id_usuario = ?
    `;

    const params = [usuarioId];

    // Si se filtra por período
    if (periodo) {
      query += ` AND p.codigo = ?`;
      params.push(periodo);
    }

    // Ordenamiento
    query += ` ORDER BY p.codigo DESC, c.nombre_curso ASC, c.seccion ASC`;

    // Ejecutar consulta
    const [matriculas] = await db.execute(query, params);

    // sin cursos
    if (!matriculas.length) {
      return ok(res, flat ? [] : {}, 'No tienes cursos matriculados');
    }

    // modo plano
    if (flat === 'true') {
      const cursosPlano = matriculas.map((m) => ({
        id_matricula: m.id_matricula,
        fecha_matricula: m.fecha_matricula,
        id_curso: m.id_curso,
        codigo: m.codigo,
        nombre_curso: m.nombre_curso,
        seccion: m.seccion,
        semestre: m.semestre,
        periodo: m.periodo_codigo,
        id_periodo: m.id_periodo,
        periodo_activo: !!m.periodo_activo,
        profesor: {
          id_usuario: m.profesor_id,
          nombre: m.profesor_nombre,
          correo_usuario: m.profesor_correo
        },
      }));
      
      return ok(res, cursosPlano);
    }

    // agrupado por periodo
    const agrupadoPorPeriodo = {};
    matriculas.forEach((m) => {
      const periodoCurso = m.periodo_codigo;
      const idPeriodo = m.id_periodo;

      if (!agrupadoPorPeriodo[periodoCurso]) {
        agrupadoPorPeriodo[periodoCurso] = {
          periodo: periodoCurso,
          id_periodo: idPeriodo,
          es_periodo_actual: !!m.periodo_activo,
          cursos: [],
        };
      }

      agrupadoPorPeriodo[periodoCurso].cursos.push({
        id_curso: m.id_curso,
        codigo: m.codigo,
        nombre_curso: m.nombre_curso,
        seccion: m.seccion,
        semestre: m.semestre,
        profesor: {
          id_usuario: m.profesor_id,
          nombre: m.profesor_nombre,
          correo_usuario: m.profesor_correo
        },
      });
    });

    const periodosOrdenados = Object.values(agrupadoPorPeriodo).sort((a, b) =>
      b.periodo.localeCompare(a.periodo)
    );

    return ok(res, periodosOrdenados);
  } catch (error) {
    console.error('❌ Error al obtener matrículas:', error);
    return fail(res, 'Error interno al obtener matrículas', 500);
  }
};

/**
 * 2) ADMIN: crear matrícula (alta)
 */
export const crearMatriculaAdmin = async (req, res) => {
  try {
    const { id_usuario, id_curso } = req.body;

    if (!id_usuario || !id_curso) {
      return fail(res, 'Faltan datos: id_usuario, id_curso');
    }

    // Verificar que el usuario existe y es estudiante
    const [usuarios] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.id_rol, r.nombre_rol 
       FROM usuario u 
       JOIN rol r ON u.id_rol = r.id_rol 
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );

    if (usuarios.length === 0) {
      return fail(res, 'Usuario no encontrado', 404);
    }

    const usuario = usuarios[0];

    // solo estudiantes
    if (usuario.id_rol !== 2) {
      return fail(res, 'Solo se pueden matricular usuarios con rol estudiante');
    }

    // Verificar que el curso existe
    const [cursos] = await db.execute(
      'SELECT id_curso, codigo, nombre_curso FROM curso WHERE id_curso = ?',
      [id_curso]
    );

    if (cursos.length === 0) {
      return fail(res, 'Curso no encontrado', 404);
    }

    // ver duplicado
    const [existentes] = await db.execute(
      'SELECT id_matricula FROM matriculas WHERE id_usuario = ? AND id_curso = ?',
      [id_usuario, id_curso]
    );

    if (existentes.length > 0) {
      return fail(res, 'El estudiante ya está matriculado en este curso', 409);
    }

    // Crear matrícula
    const [result] = await db.execute(
      'INSERT INTO matriculas (id_usuario, id_curso, fecha_matricula) VALUES (?, ?, NOW())',
      [id_usuario, id_curso]
    );

    // Obtener matrícula completa con relaciones
    const [nuevaMatricula] = await db.execute(
      `SELECT 
        m.id_matricula, m.fecha_matricula,
        u.id_usuario, u.nombre, u.correo_usuario, u.id_rol,
        c.id_curso, c.codigo, c.nombre_curso, c.seccion, c.semestre, c.id_periodo,
        p.codigo as periodo_codigo, p.activo as periodo_activo
      FROM matriculas m
      JOIN usuario u ON m.id_usuario = u.id_usuario
      JOIN curso c ON m.id_curso = c.id_curso
      JOIN periodos_academicos p ON c.id_periodo = p.id_periodo
      WHERE m.id_matricula = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Matrícula creada correctamente',
      data: nuevaMatricula[0] || null,
    });
  } catch (error) {
    console.error('[matriculas] crear admin', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return fail(res, 'El estudiante ya está matriculado en este curso', 409);
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return fail(res, 'Error de referencia: El usuario o curso no existe', 400);
    }
    
    return fail(res, 'Error interno al crear matrícula', 500);
  }
};

/**
 * 3) ADMIN: eliminar matrícula
 */
export const eliminarMatricula = async (req, res) => {
  try {
    const { id_matricula } = req.params;

    // Verificar que la matrícula existe
    const [matriculas] = await db.execute(
      'SELECT id_matricula FROM matriculas WHERE id_matricula = ?',
      [id_matricula]
    );

    if (matriculas.length === 0) {
      return fail(res, 'Matrícula no encontrada', 404);
    }

    await db.execute(
      'DELETE FROM matriculas WHERE id_matricula = ?',
      [id_matricula]
    );

    return ok(res, null, 'Matrícula eliminada correctamente');
  } catch (error) {
    console.error('[matriculas] eliminar', error);
    return fail(res, 'Error interno al eliminar matrícula', 500);
  }
};

/**
 * 4) ADMIN: listar todas las matrículas
 */
export const listarMatriculas = async (req, res) => {
  try {
    const { id_curso, id_periodo } = req.query;

    let query = `
      SELECT 
        m.id_matricula, m.fecha_matricula,
        u.id_usuario, u.nombre, u.correo_usuario, u.id_rol,
        c.id_curso, c.codigo, c.nombre_curso, c.seccion, c.semestre, c.id_periodo,
        p.codigo as periodo_codigo, p.activo as periodo_activo
      FROM matriculas m
      JOIN usuario u ON m.id_usuario = u.id_usuario
      JOIN curso c ON m.id_curso = c.id_curso
      JOIN periodos_academicos p ON c.id_periodo = p.id_periodo
    `;

    const params = [];
    const conditions = [];

    if (id_curso) {
      conditions.push('m.id_curso = ?');
      params.push(id_curso);
    }

    if (id_periodo) {
      conditions.push('c.id_periodo = ?');
      params.push(id_periodo);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.fecha_matricula DESC';

    const [matriculas] = await db.execute(query, params);

    return ok(res, matriculas);
  } catch (error) {
    console.error('[matriculas] listar error:', error);
    return fail(res, 'Error interno al listar matrículas', 500);
  }
};

/**
 * 5) ADMIN: matrículas por curso
 */
export const matriculasPorCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    // Obtener información del curso
    const [cursos] = await db.execute(
      `SELECT c.*, p.codigo as periodo_codigo, p.activo as periodo_activo
       FROM curso c 
       JOIN periodos_academicos p ON c.id_periodo = p.id_periodo 
       WHERE c.id_curso = ?`,
      [id_curso]
    );

    if (cursos.length === 0) {
      return fail(res, 'Curso no encontrado', 404);
    }

    const curso = cursos[0];

    // Obtener matrículas del curso
    const [matriculas] = await db.execute(
      `SELECT 
        m.id_matricula, m.fecha_matricula,
        u.id_usuario, u.nombre, u.correo_usuario, u.id_rol
       FROM matriculas m
       JOIN usuario u ON m.id_usuario = u.id_usuario
       WHERE m.id_curso = ?
       ORDER BY m.fecha_matricula DESC`,
      [id_curso]
    );

    return ok(res, {
      curso,
      matriculas,
      total: matriculas.length
    });

  } catch (error) {
    console.error('[matriculas] por curso error:', error);
    return fail(res, 'Error interno al obtener matrículas del curso', 500);
  }
};

export default {
  obtenerMisMatriculas,
  crearMatriculaAdmin,
  eliminarMatricula,
  listarMatriculas,
  matriculasPorCurso,
  buscarEstudiantesPorEmail,
};