import { z } from 'zod';

export const crearMediaSchema = z.object({
  clave: z.string().min(1, 'Clave obligatoria'),
  tipo: z.enum(['imagen', 'video', 'otro'], { message: 'Tipo inválido' }),
  url: z.string().min(1, 'URL obligatoria'),
  alt: z.string().optional(),
  orden: z.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarMediaSchema = z.object({
  clave: z.string().min(1, 'Clave obligatoria').optional(),
  tipo: z.enum(['imagen', 'video', 'otro'], { message: 'Tipo inválido' }).optional(),
  url: z.string().min(1, 'URL obligatoria').optional(),
  alt: z.string().optional().nullable(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
