import { z } from 'zod';

export const actualizarAsistenteBotSchema = z.object({
  activo: z.boolean(),
});
