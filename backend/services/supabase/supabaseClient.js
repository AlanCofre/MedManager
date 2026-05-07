// backend/src/supabase/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Si YA cargas dotenv en app.js con: import 'dotenv/config';
// puedes omitir el bloque dotenv/path. Si no, descomenta:
/*
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
*/

// --- Validación con máscara para no exponer secretos en logs
const mask = (v) => (typeof v === 'string' && v.length > 12 ? `${v.slice(0,6)}…${v.slice(-6)}` : v);

const URL = process.env.SUPABASE_URL;
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SRV) {
  console.error('❌ Variables de entorno no cargadas para Supabase');
  console.error('SUPABASE_URL:', URL || '(vacía)');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', mask(SRV) || '(vacía)');
  throw new Error('Faltan variables de entorno para Supabase');
}

// Cliente único (service role) para TODO el backend
export const supabase = createClient(URL, SRV, {
  auth: { persistSession: false },
  global: { headers: { 'X-MLM-Supabase': 'backend' } },
});

// Exponer nombres de buckets por si los necesitas en servicios
export const SUPABASE_BUCKET_LICENCIAS = process.env.SUPABASE_BUCKET_LICENCIAS || 'licencias';
export const SUPABASE_BUCKET_PERFIL    = process.env.SUPABASE_BUCKET_PERFIL    || 'perfil';

export default supabase;
