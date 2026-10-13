import { z } from 'zod';

export const crearContenidoSchema = z.object({
  clave: z.string().min(1, 'Clave obligatoria'),
  valor: z.string().min(1, 'Valor obligatorio'),
  seccion: z.string().min(1, 'Sección obligatoria'),
  tipo: z.string().optional().default('texto'),
  orden: z.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
});

export const actualizarContenidoSchema = z.object({
  clave: z.string().min(1, 'Clave obligatoria').optional(),
  valor: z.string().min(1, 'Valor obligatorio').optional(),
  seccion: z.string().min(1, 'Sección obligatoria').optional(),
  tipo: z.string().optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const seccionParamSchema = z.object({
  seccion: z.string().min(1, 'Sección inválida'),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
