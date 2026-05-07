const { z } = require('zod');
const dayjs = require('dayjs');

const licenciaSchema = z.object({
  tipo_licencia: z.string().min(1),
  motivo: z.string().min(10).max(5000),
  fecha_inicio: z.string().refine(v => dayjs(v, 'YYYY-MM-DD', true).isValid(), 'Formato YYYY-MM-DD'),
  fecha_fin: z.string().refine(v => dayjs(v, 'YYYY-MM-DD', true).isValid(), 'Formato YYYY-MM-DD'),
}).refine(({ fecha_inicio, fecha_fin }) => dayjs(fecha_inicio).isBefore(dayjs(fecha_fin).add(1, 'day')), {
  message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
  path: ['fecha_inicio']
});

module.exports = { licenciaSchema };