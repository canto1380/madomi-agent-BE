import { z } from 'zod';

export const crearRedSchema = z.object({
  plataforma: z.string().min(1, 'Plataforma obligatoria'),
  url: z.string().url('URL inválida'),
  orden: z.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarRedSchema = z.object({
  plataforma: z.string().min(1, 'Plataforma obligatoria').optional(),
  url: z.string().url('URL inválida').optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
