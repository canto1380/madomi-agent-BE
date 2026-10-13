import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/redes.admin.controller.js';
import {
  crearRedSchema,
  actualizarRedSchema,
  idParamSchema,
} from '../../validations/redes.validation.js';

const router = Router();
router.get('/', ctrl.listarRedesAdmin);
router.post('/', validate(crearRedSchema), ctrl.crearRed);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerRedAdmin);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarRedSchema), ctrl.actualizarRed);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarRed);
export default router;
