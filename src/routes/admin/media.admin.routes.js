import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/media.admin.controller.js';
import {
  crearMediaSchema,
  actualizarMediaSchema,
  idParamSchema,
} from '../../validations/media.validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get('/', ctrl.listarMediaAdmin);
router.post('/upload', upload.single('file'), ctrl.subirMediaArchivo);
router.post('/', validate(crearMediaSchema), ctrl.crearMedia);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerMediaAdmin);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarMediaSchema), ctrl.actualizarMedia);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarMedia);
export default router;
