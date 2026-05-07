import pool from '../config/db.js';

function isSha256Hex(s) {
  return typeof s === 'string' && /^[0-9a-f]{64}$/i.test(s);
}

export async function registrarArchivo(req, res) {
  try {
    const { ruta_url, tipo_mime, hash, tamano, id_licencia } = req.body || {};

    // --- Validaciones mínimas + reforzadas ---
    if (!ruta_url || typeof ruta_url !== 'string' || ruta_url.trim().length === 0 || ruta_url.length > 4096) {
      return res.status(400).json({ ok: false, mensaje: 'ruta_url es requerida (<=4096)' });
    }

    const mime = String(tipo_mime || '').toLowerCase().trim();
    if (!mime || mime.length > 100 || !mime.startsWith('application/pdf')) {
      return res.status(400).json({ ok: false, mensaje: 'tipo_mime inválido: debe ser application/pdf' });
    }

    if (!isSha256Hex(hash)) {
      return res.status(400).json({ ok: false, mensaje: 'hash inválido: debe ser SHA-256 hex (64 caracteres)' });
    }

    const sizeNum = Number(tamano);
    if (!Number.isInteger(sizeNum) || sizeNum <= 0 || sizeNum > 10 * 1024 * 1024) { // 10MB
      return res.status(400).json({ ok: false, mensaje: 'tamano debe ser entero positivo (<=10MB)' });
    }

    const licId = Number(id_licencia);
    if (!Number.isInteger(licId)) {
      return res.status(400).json({ ok: false, mensaje: 'id_licencia inválido' });
    }

    // --- Verificar que la licencia existe ---
    const [lic] = await pool.execute(
      'SELECT id_licencia FROM licenciamedica WHERE id_licencia = ?',
      [licId]
    );
    if (!lic.length) {
      return res.status(404).json({ ok: false, mensaje: 'Licencia no encontrada' });
    }

    // --- Insertar ---
    const sql = `
      INSERT INTO archivolicencia
        (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    const [r] = await pool.execute(sql, [ruta_url, mime, hash, sizeNum, licId]);

    return res.status(201).json({
      ok: true,
      mensaje: 'Archivo registrado',
      data: { id_archivo: r.insertId }
    });
  } catch (e) {
    // Duplicado por restricción única
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        ok: false,
        mensaje: 'Archivo duplicado (hash ya existe)'
      });
    }
    console.error('Error registrando archivo:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error registrando archivo', detalle: e.message });
  }
}

export default { registrarArchivo };
