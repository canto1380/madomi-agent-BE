import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from '../../controllers/categorias.admin.controller.js';
import {
  crearCategoriaSchema,
  actualizarCategoriaSchema,
  reordenarCategoriasSchema,
  idParamSchema,
} from '../../validations/categorias.validation.js';

const router = Router();
router.get('/', ctrl.listarCategoriasAdmin);
router.post('/', validate(crearCategoriaSchema), ctrl.crearCategoria);
router.put('/orden', validate(reordenarCategoriasSchema), ctrl.reordenarCategorias);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.obtenerCategoriaAdmin);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarCategoriaSchema), ctrl.actualizarCategoria);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.eliminarCategoria);
export default router;
