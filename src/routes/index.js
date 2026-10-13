import { Router } from 'express';
import productosRoutes from './productos.routes.js';
import productosAdminRoutes from './admin/productos.admin.routes.js';
import categoriasRoutes from './categorias.routes.js';
import categoriasAdminRoutes from './admin/categorias.admin.routes.js';
import contenidoRoutes from './contenido.routes.js';
import contenidoAdminRoutes from './admin/contenido.admin.routes.js';
import brandingRoutes from './branding.routes.js';
import brandingAdminRoutes from './admin/branding.admin.routes.js';
import contactoRoutes from './contacto.routes.js';
import contactoAdminRoutes from './admin/contacto.admin.routes.js';
import destacadosAdminRoutes from './admin/destacados.admin.routes.js';
import mediaRoutes from './media.routes.js';
import mediaAdminRoutes from './admin/media.admin.routes.js';
import redesRoutes from './redes.routes.js';
import redesAdminRoutes from './admin/redes.admin.routes.js';
import statsAdminRoutes from './admin/stats.admin.routes.js';
import asistenteAdminRoutes from './admin/asistente.admin.routes.js';
import crmAdminRoutes from './admin/crm.admin.routes.js';
import chatRoutes from './chat.routes.js';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import rolesRoutes from './roles.routes.js';
import permisosRoutes from './permisos.routes.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

const adminAuth = [authenticateToken, requireAuth];

router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/contenido', contenidoRoutes);
router.use('/branding', brandingRoutes);
router.use('/contacto', contactoRoutes);
router.use('/media', mediaRoutes);
router.use('/redes', redesRoutes);
router.use('/chat', chatRoutes);

router.use('/admin/productos', ...adminAuth, productosAdminRoutes);
router.use('/admin/categorias', ...adminAuth, categoriasAdminRoutes);
router.use('/admin/contenido', ...adminAuth, contenidoAdminRoutes);
router.use('/admin/branding', ...adminAuth, brandingAdminRoutes);
router.use('/admin/contacto', ...adminAuth, contactoAdminRoutes);
router.use('/admin/destacados', ...adminAuth, destacadosAdminRoutes);
router.use('/admin/media', ...adminAuth, mediaAdminRoutes);
router.use('/admin/redes', ...adminAuth, redesAdminRoutes);
router.use('/admin/stats', ...adminAuth, statsAdminRoutes);
router.use('/admin/asistente', ...adminAuth, asistenteAdminRoutes);
router.use('/admin/crm', ...adminAuth, crmAdminRoutes);

router.use('/auth', authRoutes);
router.use('/usuarios', authenticateToken, requireAuth, usuariosRoutes);
router.use('/roles', authenticateToken, requireAuth, rolesRoutes);
router.use('/permisos', authenticateToken, requireAuth, permisosRoutes);

export default router;
