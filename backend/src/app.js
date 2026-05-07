// backend/src/app.js
import '../config/env.js';               
import express from 'express';
import cors from 'cors';

import detailsRouter from './detail/details.js';
import insertRouter from './insert/insert.js';
import notificacionesRouter from './routes/notificaciones.route.js';
import licenciasRouter from './routes/licencias.routes.js';
import healthRouter from './routes/health.route.js';
import usuarioRoutes from './routes/usuario.route.js';
import perfilRouter from './routes/perfil.routes.js';
import archivoRoutes from './routes/archivo.routes.js';
import cursoRoutes from './routes/curso.route.js';
import matriculasRoutes from './routes/matriculas.routes.js';
import devMailRoutes from './routes/dev.mail.routes.js';
import adminRoutes from './routes/admin.route.js';
import reportesRouter from './routes/reportes.route.js';
import regularidadRoutes from './routes/regularidad.routes.js';
import { attachAudit } from '../middlewares/audit.middleware.js';
import db from '../config/db.js';
import estudianteRoutes from './routes/estudiante.routes.js';
import funcionarioRoutes from './routes/funcionario.routes.js';
import periodoRoutes from './routes/periodo.route.js';
import entregasRoutes from './routes/entregas.routes.js';
import profesorRoutes from './routes/profesor.routes.js';



const app = express();
const PORT = process.env.PORT || 3000;

console.log('[env] JWT_SECRET set?', !!process.env.JWT_SECRET);
console.log('[DB CONFIG]', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* === CORS === */
const corsOptions = {
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-token'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* === Middlewares globales === */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* === Audit === */
app.use(attachAudit()); // deja req.audit disponible en todos los entornos

/* === Rutas de DEV (solo fuera de producción) === */
if (process.env.NODE_ENV !== 'production') {
  app.use(devMailRoutes);
}

/* === Rutas === */
app.use(healthRouter);
app.use('/api/periodos', periodoRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/licencias', licenciasRouter);
app.use('/api/regularidad', regularidadRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/licencias', detailsRouter);
app.use('/archivos', insertRouter);
app.use('/api/entregas', entregasRoutes);
app.use('/api/notificaciones', notificacionesRouter);
app.use('/usuarios', usuarioRoutes);
app.use('/api', perfilRouter);
app.use('/api/cursos', cursoRoutes);
app.use('/api/matriculas', matriculasRoutes);
app.use('/funcionario', funcionarioRoutes);
app.use('/api/admin', adminRoutes);

app.use(reportesRouter);

// Profesor
app.use('/profesor', profesorRoutes);
app.use('/api/regularidad', regularidadRoutes);

// Reportes (SIN prefijo → /reportes/licencias/exceso)
app.use(reportesRouter);

/* === MIDDLEWARE DE AUDITORÍA - POSICIÓN CORRECTA === */
// ¡IMPORTANTE: Después de todas las rutas que establecen req.user!
app.use(attachAudit());

// Home
app.get('/', (req, res) => res.redirect('/usuarios/login'));

/* === 404 === */
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

/* === Error handler global === */
app.use((err, req, res, next) => {
  console.error('💥 Error no controlado:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

/* === Arranque === */
app.listen(PORT, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS ok');
    console.log('📡 Conexión a MySQL OK:', rows[0]);
  } catch (err) {
    console.error('❌ Error conectando a MySQL al iniciar:', err.message);
  }
});

export default app;