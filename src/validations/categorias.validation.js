import { z } from 'zod';

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  slug: z.string().min(1, 'Slug obligatorio').optional(),
  orden: z.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarCategoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').optional(),
  slug: z.string().min(1, 'Slug obligatorio').optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
