import { z } from 'zod';

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'ID inválido');

const paginacionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

const fechaOpcional = z.string().trim().min(1).optional();

export const mongoIdParamSchema = z.object({
  id: mongoId,
});

export const listarLeadsQuerySchema = paginacionQuerySchema.extend({
  estado: z
    .enum([
      'nuevo',
      'consultando',
      'presupuesto_abierto',
      'presupuesto_enviado',
      'pedido_cerrado',
      'abandonado',
      'pendiente_validacion_logistica',
    ])
    .optional(),
  desde: fechaOpcional,
  hasta: fechaOpcional,
  telefono: z.string().trim().min(1).optional(),
  nombre: z.string().trim().min(1).optional(),
  localidad: z.string().trim().min(1).optional(),
  productoId: z.string().trim().min(1).optional(),
  requiereContacto: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  sort: z.enum(['updatedAt', 'ultimoMensajeAt', 'createdAt', 'estado']).optional().default('updatedAt'),
});

const estadoLeadEnum = z.enum([
  'nuevo',
  'consultando',
  'presupuesto_abierto',
  'presupuesto_enviado',
  'pedido_cerrado',
  'abandonado',
  'pendiente_validacion_logistica',
]);

export const actualizarLeadSchema = z
  .object({
    estado: estadoLeadEnum.optional(),
    asignadoAUsuarioId: z.string().trim().min(1).nullable().optional(),
    cuelloBotella: z.enum(['precio', 'envio', 'stock', 'solo_consulta', 'otro']).nullable().optional(),
    motivoAbandono: z.string().trim().max(500).nullable().optional(),
    notas: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const listarPresupuestosQuerySchema = paginacionQuerySchema.extend({
  estado: z.enum(['borrador', 'enviado', 'aceptado', 'vencido', 'rechazado']).optional(),
  clienteId: mongoId.optional(),
  leadId: mongoId.optional(),
  desde: fechaOpcional,
  hasta: fechaOpcional,
  sort: z.enum(['createdAt', 'updatedAt', 'total', 'estado']).optional().default('createdAt'),
});

export const listarPedidosQuerySchema = paginacionQuerySchema.extend({
  estadoLogistico: z
    .enum(['pedido_cerrado', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado'])
    .optional(),
  clienteId: mongoId.optional(),
  leadId: mongoId.optional(),
  desde: fechaOpcional,
  hasta: fechaOpcional,
  sort: z.enum(['createdAt', 'updatedAt', 'estadoLogistico']).optional().default('createdAt'),
});

export const actualizarPedidoSchema = z.object({
  estadoLogistico: z.enum([
    'pedido_cerrado',
    'en_preparacion',
    'en_ruta',
    'entregado',
    'cancelado',
  ]),
});

export const publicarContextoSchema = z.object({
  tipo: z.enum(['politicas_entrega', 'faq_comercial', 'tono_marca']),
  version: z.string().trim().min(1, 'Versión obligatoria').max(64),
  markdown: z.string().trim().min(10, 'Markdown demasiado corto'),
  origenPdfUrl: z.string().url('URL inválida').nullable().optional(),
});
