import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../validations/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/logout', validate(logoutSchema), ctrl.logout);
router.get('/me', authenticateToken, requireAuth, ctrl.me);

export default router;

export { authenticateToken } from '../middlewares/authenticateToken.js';
export { requireAuth } from '../middlewares/requireAuth.js';
