import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/destacados.admin.controller.js';
import {
  crearDestacadoSchema,
  actualizarDestacadoSchema,
  idParamSchema,
} from '../../validations/destacados.validation.js';

const router = Router();
router.get('/', ctrl.listarDestacadosAdmin);
router.post('/', validate(crearDestacadoSchema), ctrl.crearDestacado);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerDestacadoAdmin);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarDestacadoSchema), ctrl.actualizarDestacado);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarDestacado);
export default router;
