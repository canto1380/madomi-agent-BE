import { Router } from 'express';
import { obtenerStatsAdmin } from '../../controllers/stats.admin.controller.js';

const router = Router();
router.get('/', obtenerStatsAdmin);
export default router;
