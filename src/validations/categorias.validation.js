import { z } from 'zod';

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  slug: z.string().min(1, 'Slug obligatorio').optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional().default(true),
});

export const actualizarCategoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').optional(),
  slug: z.string().min(1, 'Slug obligatorio').optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const reordenarCategoriasSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Indicá el orden de las categorías'),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
