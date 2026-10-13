import { Router } from 'express';
import { listarMedia } from '../controllers/media.controller.js';

const router = Router();
router.get('/', listarMedia);
export default router;
