import { z } from 'zod';

const colorSchema = z.string().min(1, 'Color obligatorio');

export const actualizarBrandingSchema = z.object({
  colorPrimario: colorSchema.optional(),
  colorPrimarioOscuro: colorSchema.optional(),
  colorSecundario: colorSchema.optional(),
  colorAcento: colorSchema.optional(),
  colorFondo: colorSchema.optional(),
  colorFondoOscuro: colorSchema.optional(),
  colorTexto: colorSchema.optional(),
  colorTextoClaro: colorSchema.optional(),
  colorError: colorSchema.optional(),
  colorExito: colorSchema.optional(),
  logoUrl: z.string().min(1, 'URL del logo obligatoria').optional(),
  logoAlt: z.string().min(1, 'Texto alternativo obligatorio').optional(),
  activo: z.boolean().optional(),
});
