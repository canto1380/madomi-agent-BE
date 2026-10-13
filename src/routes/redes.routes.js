import { Router } from 'express';
import { listarRedes } from '../controllers/redes.controller.js';

const router = Router();
router.get('/', listarRedes);
export default router;
