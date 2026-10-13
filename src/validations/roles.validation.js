import { z } from 'zod';

export const crearRolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
});

export const actualizarRolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
  descripcion: z.string().optional().nullable(),
});

export const sincronizarPermisosRolSchema = z.object({
  permisoIds: z.array(z.string().min(1)).default([]),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
