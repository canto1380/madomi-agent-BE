import { z } from 'zod';

export const crearPermisoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es obligatorio')
    .regex(/^[a-z]+\.[a-z]+$/, 'Formato esperado: dominio.accion (ej. usuarios.crear)'),
  descripcion: z.string().optional().nullable(),
});

export const actualizarPermisoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es obligatorio')
    .regex(/^[a-z]+\.[a-z]+$/, 'Formato esperado: dominio.accion (ej. usuarios.crear)')
    .optional(),
  descripcion: z.string().optional().nullable(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
