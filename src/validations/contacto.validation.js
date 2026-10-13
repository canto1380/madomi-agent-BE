import { z } from 'zod';

export const actualizarContactoSchema = z.object({
  telefono: z.string().min(1, 'Teléfono obligatorio').optional(),
  telefonoLink: z.string().min(1, 'Teléfono link obligatorio').optional(),
  email: z.string().email('Email inválido').optional(),
  whatsapp: z.string().url('URL de WhatsApp inválida').optional(),
  direccion: z.string().min(1, 'Dirección obligatoria').optional(),
  horario: z.string().min(1, 'Horario obligatorio').optional(),
  activo: z.boolean().optional(),
});
