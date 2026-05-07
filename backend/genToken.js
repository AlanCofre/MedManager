// backend/genToken.js
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // asume backend/.env

import { generarJWT } from './utils/jwt.js'; // usa tu helper existente

(async () => {
  const idArg = process.argv[2] || '8';    // id_usuario
  const rolArg = process.argv[3] || 'estudiante'; // ejemplo: 'estudiante' o 'Secretario'
  const id = Number(idArg);
  const rol = String(rolArg);

  try {
    const token = await generarJWT(id, rol);
    console.log('Bearer ' + token);
  } catch (err) {
    console.error('Error generando token:', err);
    process.exit(1);
  }
})();
