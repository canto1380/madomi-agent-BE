import { Router } from 'express';
import * as ctrl from '../controllers/usuarios.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  cambiarRolUsuarioSchema,
  idParamSchema,
} from '../validations/usuarios.validation.js';

const router = Router();

router.get('/', ctrl.listarUsuarios);
router.post('/', validate(crearUsuarioSchema), ctrl.crearUsuario);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerUsuario);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarUsuarioSchema), ctrl.actualizarUsuario);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarUsuario);
router.put('/:id/reactivar', validate(idParamSchema, 'params'), ctrl.reactivarUsuario);
router.put('/:id/rol', validate(idParamSchema, 'params'), validate(cambiarRolUsuarioSchema), ctrl.cambiarRolUsuario);

export default router;
