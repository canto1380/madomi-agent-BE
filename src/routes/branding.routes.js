import { Router } from 'express';
import { obtenerBranding } from '../controllers/branding.controller.js';

const router = Router();
router.get('/', obtenerBranding);
export default router;
