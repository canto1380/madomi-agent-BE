import { Router } from 'express';
import { listarProductos } from '../controllers/productos.controller.js';
import { listarDestacados } from '../controllers/destacados.controller.js';

const router = Router();

router.get('/destacados', listarDestacados);
router.get('/', listarProductos);

export default router;
