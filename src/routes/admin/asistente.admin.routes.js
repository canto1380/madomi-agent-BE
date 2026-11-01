import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  obtenerEmpresaAsistenteAdmin,
  listarContextosAsistenteAdmin,
  obtenerContextoVigenteAsistenteAdmin,
  actualizarAsistenteBotAdmin,
  obtenerSaludRuntimeAsistenteAdmin,
} from '../../controllers/asistente.admin.controller.js';
import { requirePermiso } from '../../middlewares/requirePermiso.js';
import { PERMISOS_COMERCIAL } from '../../constants/permisos.js';
import { actualizarAsistenteBotSchema } from '../../validations/asistente.validation.js';

const router = Router();
const leerComercial = requirePermiso(PERMISOS_COMERCIAL.LEER);
const escribirComercial = requirePermiso(PERMISOS_COMERCIAL.ESCRIBIR);

router.get('/empresa', leerComercial, obtenerEmpresaAsistenteAdmin);
router.get('/runtime/salud', leerComercial, obtenerSaludRuntimeAsistenteAdmin);
router.patch(
  '/bot',
  escribirComercial,
  validate(actualizarAsistenteBotSchema),
  actualizarAsistenteBotAdmin,
);
router.get('/contexto', leerComercial, listarContextosAsistenteAdmin);
router.get('/contexto/vigente', leerComercial, obtenerContextoVigenteAsistenteAdmin);

export default router;
