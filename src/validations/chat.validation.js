import { z } from 'zod';

export const chatMensajeSchema = z.object({
  sessionAnonimaId: z.string().uuid('sessionAnonimaId debe ser UUID'),
  mensaje: z
    .string()
    .trim()
    .min(1, 'Mensaje vacío')
    .max(4000, 'Mensaje demasiado largo'),
  metadata: z
    .object({
      canal: z.string().optional().default('web_chat'),
    })
    .optional()
    .default({ canal: 'web_chat' }),
});
