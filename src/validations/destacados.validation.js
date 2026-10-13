import { z } from 'zod';

export const crearDestacadoSchema = z.object({
  productoId: z.string().min(1, 'Producto obligatorio'),
  seccion: z.string().min(1, 'Sección obligatoria').optional().default('lo_ultimo'),
  orden: z.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarDestacadoSchema = z.object({
  productoId: z.string().min(1, 'Producto obligatorio').optional(),
  seccion: z.string().min(1, 'Sección obligatoria').optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
