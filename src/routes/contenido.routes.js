import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { obtenerContenido, obtenerContenidoSeccion } from '../controllers/contenido.controller.js';
import { seccionParamSchema } from '../validations/contenido.validation.js';

const router = Router();
router.get('/', obtenerContenido);
router.get('/:seccion', validate(seccionParamSchema, 'params'), obtenerContenidoSeccion);
export default router;
