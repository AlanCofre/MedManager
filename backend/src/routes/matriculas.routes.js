// backend/routes/matricula.route.js
import { Router } from 'express';
import { 
  obtenerMisMatriculas, 
  crearMatriculaAdmin, 
  eliminarMatricula, 
  listarMatriculas,
  matriculasPorCurso,
  buscarEstudiantesPorEmail,
} from '../../controllers/matricula.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';
import { esAdmin, esEstudiante } from '../../middlewares/roles.middleware.js';

const router = Router();

// Estudiantes: sus propias matrículas
router.get('/mis-matriculas', requireAuth, esEstudiante, obtenerMisMatriculas);


// Administradores: gestión completa
router.get('/', requireAuth, esAdmin, listarMatriculas);
router.post('/', requireAuth, esAdmin, crearMatriculaAdmin);
router.delete('/:id_matricula', requireAuth, esAdmin, eliminarMatricula);
router.get('/curso/:id_curso', requireAuth, esAdmin, matriculasPorCurso);
router.get('/estudiantes', requireAuth, esAdmin, buscarEstudiantesPorEmail);
export default router;