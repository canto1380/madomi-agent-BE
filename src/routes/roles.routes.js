import { Router } from 'express';
import * as ctrl from '../controllers/roles.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  crearRolSchema,
  actualizarRolSchema,
  sincronizarPermisosRolSchema,
  idParamSchema,
} from '../validations/roles.validation.js';

const router = Router();

router.get('/', ctrl.listarRoles);
router.post('/', validate(crearRolSchema), ctrl.crearRol);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerRol);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarRolSchema), ctrl.actualizarRol);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarRol);
router.put(
  '/:id/permisos',
  validate(idParamSchema, 'params'),
  validate(sincronizarPermisosRolSchema),
  ctrl.sincronizarPermisosRol,
);

export default router;
