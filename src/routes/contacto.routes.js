import { Router } from 'express';
import { obtenerContacto } from '../controllers/contacto.controller.js';

const router = Router();
router.get('/', obtenerContacto);
export default router;
