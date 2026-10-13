import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requirePermiso } from '../../middlewares/requirePermiso.js';
import { PERMISOS_COMERCIAL } from '../../constants/permisos.js';
import {
  mongoIdParamSchema,
  actualizarLeadSchema,
  actualizarPedidoSchema,
  publicarContextoSchema,
} from '../../validations/crm.validation.js';
import {
  listarLeadsAdmin,
  obtenerLeadAdmin,
  actualizarLeadAdmin,
  obtenerConversacionAdmin,
  listarPresupuestosAdmin,
  obtenerPresupuestoPdfAdmin,
  listarPedidosAdmin,
  actualizarPedidoAdmin,
  statsResumenCrmAdmin,
  statsCuelloBotellaCrmAdmin,
  publicarContextoCrmAdmin,
} from '../../controllers/crm.admin.controller.js';

const router = Router();

const leerComercial = requirePermiso(PERMISOS_COMERCIAL.LEER);
const escribirComercial = requirePermiso(PERMISOS_COMERCIAL.ESCRIBIR);
const publicarContexto = requirePermiso(PERMISOS_COMERCIAL.CONTEXTO_PUBLICAR);

router.get('/stats/resumen', leerComercial, statsResumenCrmAdmin);
router.get('/stats/cuello-botella', leerComercial, statsCuelloBotellaCrmAdmin);

router.get('/leads', leerComercial, listarLeadsAdmin);
router.get('/leads/:id', leerComercial, validate(mongoIdParamSchema, 'params'), obtenerLeadAdmin);
router.patch(
  '/leads/:id',
  escribirComercial,
  validate(mongoIdParamSchema, 'params'),
  validate(actualizarLeadSchema),
  actualizarLeadAdmin,
);

router.get(
  '/conversaciones/:id',
  leerComercial,
  validate(mongoIdParamSchema, 'params'),
  obtenerConversacionAdmin,
);

router.get('/presupuestos', leerComercial, listarPresupuestosAdmin);
router.get(
  '/presupuestos/:id/pdf',
  leerComercial,
  validate(mongoIdParamSchema, 'params'),
  obtenerPresupuestoPdfAdmin,
);

router.get('/pedidos', leerComercial, listarPedidosAdmin);
router.patch(
  '/pedidos/:id',
  escribirComercial,
  validate(mongoIdParamSchema, 'params'),
  validate(actualizarPedidoSchema),
  actualizarPedidoAdmin,
);

router.post('/contexto/publicar', publicarContexto, validate(publicarContextoSchema), publicarContextoCrmAdmin);

export default router;
