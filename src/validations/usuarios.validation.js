import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  clave: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  rolId: z.string().min(1, 'El rol es obligatorio'),
  activo: z.boolean().optional().default(true),
});

export const actualizarUsuarioSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  clave: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
  apellido: z.string().min(1, 'El apellido es obligatorio').optional(),
  rolId: z.string().min(1, 'El rol es obligatorio').optional(),
  activo: z.boolean().optional(),
});

export const cambiarRolUsuarioSchema = z.object({
  rolId: z.string().min(1, 'El rol es obligatorio'),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
