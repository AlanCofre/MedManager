// backend/controllers/periodo.controller.js
import { Op, fn, col, literal } from 'sequelize';
import Periodo from '../src/models/modelo_Periodo.js';
import Curso from '../src/models/modelo_Curso.js';

// helper simple de respuestas
function ok(res, data, mensaje = 'OK') {
  return res.status(200).json({ ok: true, mensaje, data });
}

function fail(res, mensaje = 'Error en la solicitud', status = 400, extra = {}) {
  return res.status(status).json({ ok: false, mensaje, ...extra });
}

/**
 * GET /periodos - Listar todos los períodos
 */
export const listarPeriodos = async (req, res) => {
  try {
    const periodos = await Periodo.findAll({
      order: [['codigo', 'DESC']]
    });

    // Enriquecer con conteo de cursos para cada período
    const periodosConConteo = await Promise.all(
      periodos.map(async (p) => {
        const cursosCount = await Curso.count({ where: { id_periodo: p.id_periodo } });
        return { ...p.toJSON(), cursosCount };
      })
    );

    return ok(res, periodosConConteo);
  } catch (error) {
    console.error('[periodos] error listando:', error);
    return fail(res, 'Error interno al listar períodos', 500);
  }
};

/**
 * POST /periodos - Crear nuevo período
 */
export const crearPeriodo = async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return fail(res, 'El campo código es obligatorio');
    }

    // Validar formato del código (ej: 2025-1, 2025-2)
    const codigoRegex = /^\d{4}-[12]$/;
    if (!codigoRegex.test(codigo)) {
      return fail(res, 'Formato de código inválido. Use: AÑO-SEMESTRE (ej: 2025-1, 2025-2)');
    }

    // Verificar que no exista
    const existe = await Periodo.findOne({ where: { codigo } });
    if (existe) {
      return fail(res, 'Ya existe un período con ese código', 409);
    }

    const nuevoPeriodo = await Periodo.create({
      codigo,
      activo: false // Por defecto inactivo
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Período creado correctamente',
      data: nuevoPeriodo
    });

  } catch (error) {
    console.error('[periodos] error creando:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Ya existe un período con ese código', 409);
    }
    
    return fail(res, 'Error interno al crear período', 500);
  }
};

/**
 * PATCH /periodos/:id/activar - Activar período (y desactivar los demás)
 */
export const activarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;

    const periodo = await Periodo.findByPk(id);
    if (!periodo) {
      return fail(res, 'Período no encontrado', 404);
    }

    // Transacción para asegurar consistencia
    const transaction = await Periodo.sequelize.transaction();

    try {
      // 1. Desactivar todos los períodos
      await Periodo.update(
        { activo: false },
        { where: {}, transaction }
      );

      // 2. Activar solo el período indicado
      await Periodo.update(
        { activo: true },
        { where: { id_periodo: id }, transaction }
      );

      await transaction.commit();

      // Obtener el período actualizado
      const periodoActualizado = await Periodo.findByPk(id);

      return ok(res, periodoActualizado, 'Período activado correctamente');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('[periodos] error activando:', error);
    return fail(res, 'Error interno al activar período', 500);
  }
};

/**
 * PATCH /periodos/:id/desactivar - Desactivar período
 */
export const desactivarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;

    const periodo = await Periodo.findByPk(id);
    if (!periodo) {
      return fail(res, 'Período no encontrado', 404);
    }

    await Periodo.update(
      { activo: false },
      { where: { id_periodo: id } }
    );

    const periodoActualizado = await Periodo.findByPk(id);

    return ok(res, periodoActualizado, 'Período desactivado correctamente');

  } catch (error) {
    console.error('[periodos] error desactivando:', error);
    return fail(res, 'Error interno al desactivar período', 500);
  }
};

/**
 * GET /periodos/activo - Obtener período activo actual
 */
export const obtenerPeriodoActivo = async (req, res) => {
  try {
    const periodoActivo = await Periodo.findOne({
      where: { activo: true }
    });

    if (!periodoActivo) {
      return fail(res, 'No hay período activo configurado', 404);
    }

    return ok(res, periodoActivo);
  } catch (error) {
    console.error('[periodos] error obteniendo activo:', error);
    return fail(res, 'Error interno al obtener período activo', 500);
  }
};

/**
 * PUT /periodos/:id - Actualizar período
 */
export const actualizarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo } = req.body;

    if (!codigo) {
      return fail(res, 'El campo código es obligatorio');
    }

    const periodo = await Periodo.findByPk(id);
    if (!periodo) {
      return fail(res, 'Período no encontrado', 404);
    }

    // Validar formato
    const codigoRegex = /^\d{4}-[12]$/;
    if (!codigoRegex.test(codigo)) {
      return fail(res, 'Formato de código inválido. Use: AÑO-SEMESTRE (ej: 2025-1, 2025-2)');
    }

    // Verificar si tiene cursos/ramos asociados
    const cursosAsociados = await Curso.count({ where: { id_periodo: id } });
    if (cursosAsociados > 0) {
      return fail(
        res,
        `No se puede editar: el período tiene ${cursosAsociados} ramo(s) registrado(s).`,
        400
      );
    }

    // Verificar que no exista otro período con el mismo código
    const existe = await Periodo.findOne({ 
      where: { codigo, id_periodo: { [Op.ne]: id } }
    });
    if (existe) {
      return fail(res, 'Ya existe otro período con ese código', 409);
    }

    periodo.codigo = codigo;
    await periodo.save();

    return ok(res, periodo, 'Período actualizado correctamente');

  } catch (error) {
    console.error('[periodos] error actualizando:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Ya existe un período con ese código', 409);
    }
    
    return fail(res, 'Error interno al actualizar período', 500);
  }
};

/**
 * DELETE /periodos/:id - Eliminar período (solo si no tiene cursos)
 */
export const eliminarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;

    const periodo = await Periodo.findByPk(id);
    if (!periodo) {
      return fail(res, 'Período no encontrado', 404);
    }

    // No permitir eliminar el periodo activo
    if (periodo.activo) {
      return fail(res, 'No se puede eliminar el período activo. Activa otro período primero.', 400);
    }

    // Verificar si tiene cursos/ramos asociados
    const cursosAsociados = await Curso.count({ where: { id_periodo: id } });
    if (cursosAsociados > 0) {
      return fail(
        res,
        `No se puede eliminar: el período tiene ${cursosAsociados} ramo(s) registrado(s).`,
        400
      );
    }

    await periodo.destroy();

    return ok(res, { id_periodo: Number(id) }, 'Período eliminado correctamente');

  } catch (error) {
    console.error('[periodos] error eliminando:', error);
    return fail(res, 'Error interno al eliminar período', 500);
  }
};