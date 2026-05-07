// backend/src/routes/licenciaarchivo.route.js
import { Router } from 'express';
import multer from 'multer';
import db from '../../config/db.js'; // ajusta si tu DB está en otro lugar

const UPLOAD_MAX_MB = parseInt(process.env.UPLOAD_MAX_MB || '5', 10);
const ALLOWED = (process.env.UPLOAD_ALLOWED_MIME || 'application/pdf,image/jpeg,image/png').split(',');

const upload = multer({
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error('TIPO_NO_PERMITIDO')),
});

const router = Router();

router.post('/licencias/:id/archivo', upload.single('file'), async (req, res) => {
  try {
    const idLicencia = Number(req.params.id);
    const { ruta_url, tipo_mime, hash, tamano } = req.body;

    // Validación de campos obligatorios
    const camposFaltantes = [];
    if (!idLicencia) camposFaltantes.push("id_licencia");
    if (!ruta_url) camposFaltantes.push("ruta_url");
    if (!tipo_mime) camposFaltantes.push("tipo_mime");
    if (!hash) camposFaltantes.push("hash");
    if (!tamano) camposFaltantes.push("tamano");

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        error: true,
        code: "CAMPOS_OBLIGATORIOS_FALTANTES",
        message: "Faltan campos obligatorios para registrar el archivo.",
        missing_fields: camposFaltantes,
        timestamp: new Date().toISOString()
      });
    }

    // Inserción en la base de datos
    await db.execute(`
      INSERT INTO archivolicencia
        (id_licencia, ruta_url, tipo_mime, hash, tamano, fecha_subida)
      VALUES (?, ?, ?, ?, ?, CURDATE())
    `, [idLicencia, ruta_url, tipo_mime, hash, tamano]);

    console.log(`[AUDITORÍA] Archivo registrado para licencia ${idLicencia} → ${ruta_url}`);

    return res.status(201).json({
      ok: true,
      mensaje: 'Archivo registrado correctamente'
    });

  } catch (e) {
    // Tipos de error conocidos
    if (e.message === 'TIPO_NO_PERMITIDO') {
      return res.status(415).json({
        error: true,
        code: "TIPO_NO_PERMITIDO",
        message: 'Tipo de archivo no permitido. Acepte PDF/JPG/PNG.'
      });
    }

    if (e.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        code: "ARCHIVO_DEMASIADO_GRANDE",
        message: `El archivo supera el límite de ${UPLOAD_MAX_MB} MB.`
      });
    }

    // Error inesperado
    console.error('❌ Error al registrar archivo:', e);
    return res.status(500).json({
      error: true,
      code: "ERROR_INTERNO",
      message: 'Error al subir el archivo',
      detalle: e.message
    });
  }
});


export default router;
