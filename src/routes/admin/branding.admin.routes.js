import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/branding.admin.controller.js';
import { actualizarBrandingSchema } from '../../validations/branding.validation.js';

const router = Router();
router.get('/', ctrl.obtenerBrandingAdmin);
router.put('/', validate(actualizarBrandingSchema), ctrl.actualizarBranding);
export default router;
