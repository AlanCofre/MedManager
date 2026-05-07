const MIMES = new Set(['application/pdf','image/jpeg','image/png']);
const MAX_BYTES = 5 * 1024 * 1024;

export function validarArchivo(file) {
  if (!file) return { ok: false, error: 'Archivo adjunto es obligatorio' };
  if (!MIMES.has(file.mimetype)) return { ok: false, error: 'Tipo de archivo no permitido' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'Archivo excede 5MB' };
  return { ok: true };
}
