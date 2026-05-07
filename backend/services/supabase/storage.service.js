// backend/services/supabase/storage.service.js
import crypto from 'crypto';
import { supabase } from './supabaseClient.js';

const BUCKET = process.env.SUPABASE_BUCKET_LICENCIAS || 'licencias';

// Hash auxiliar para evitar duplicados
export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sube un PDF a Supabase Storage.
 * @param {object} file - Archivo de multer (req.file)
 * @param {number|string} usuarioId - ID del usuario propietario
 * @returns {Promise<{ruta_url: string, hash: string, tipo_mime: string, tamano: number}>}
 */
export async function subirPDFLicencia(file, usuarioId) {
  if (!file || !file.buffer) throw new Error('Archivo no recibido');
  if (!file.mimetype?.includes('pdf')) throw new Error('Solo se aceptan archivos PDF');

  const hash = sha256(file.buffer);
  const nombre = `licencia-${hash.slice(0, 8)}.pdf`;
  const ruta = `${usuarioId}/${nombre}`;

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    console.error('❌ Error al subir a Supabase:', error.message);
    throw new Error('Error al subir archivo a Supabase');
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(ruta);

  return {
    ruta_url: publicUrl.publicUrl,
    hash,
    tipo_mime: file.mimetype,
    tamano: file.size,
  };
}
