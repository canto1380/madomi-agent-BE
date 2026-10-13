import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/productos.admin.controller.js';
import {
  crearProductoSchema,
  actualizarProductoSchema,
  idParamSchema,
} from '../../validations/productos.validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.get('/', ctrl.listarProductosAdmin);
router.post('/upload', upload.single('file'), ctrl.subirImagenProducto);
router.post('/', validate(crearProductoSchema), ctrl.crearProducto);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerProductoAdmin);
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(actualizarProductoSchema),
  ctrl.actualizarProducto,
);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarProducto);

export default router;
