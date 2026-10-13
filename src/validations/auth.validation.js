import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  clave: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  clave: z.string().min(1, 'La contraseña es obligatoria'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es obligatorio'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es obligatorio').optional(),
});
