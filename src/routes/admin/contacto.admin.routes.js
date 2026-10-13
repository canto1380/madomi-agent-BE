import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/contacto.admin.controller.js';
import { actualizarContactoSchema } from '../../validations/contacto.validation.js';

const router = Router();
router.get('/', ctrl.obtenerContactoAdmin);
router.put('/', validate(actualizarContactoSchema), ctrl.actualizarContacto);
export default router;
