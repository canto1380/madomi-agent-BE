import { Router } from 'express';
import * as ctrl from '../controllers/permisos.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  crearPermisoSchema,
  actualizarPermisoSchema,
  idParamSchema,
} from '../validations/permisos.validation.js';

const router = Router();

router.get('/', ctrl.listarPermisos);
router.post('/', validate(crearPermisoSchema), ctrl.crearPermiso);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerPermiso);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarPermisoSchema), ctrl.actualizarPermiso);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarPermiso);

export default router;
