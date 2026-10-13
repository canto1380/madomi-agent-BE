import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/contenido.admin.controller.js';
import {
  crearContenidoSchema,
  actualizarContenidoSchema,
  idParamSchema,
} from '../../validations/contenido.validation.js';

const router = Router();
router.get('/', ctrl.listarContenidoAdmin);
router.post('/', validate(crearContenidoSchema), ctrl.crearContenido);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerContenidoAdmin);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarContenidoSchema), ctrl.actualizarContenido);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarContenido);
export default router;
