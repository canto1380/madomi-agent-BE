import { z } from 'zod';

const imagenUrlSchema = z
  .string()
  .url('URL inválida')
  .optional()
  .or(z.literal(''));

const unidadStockSchema = z.enum(['un', 'kg', 'caja'], {
  errorMap: () => ({ message: 'Unidad de stock inválida (un, kg, caja)' }),
});

const precioOpcionalSchema = z
  .number({ invalid_type_error: 'Precio inválido' })
  .nonnegative('El precio no puede ser negativo')
  .nullable()
  .optional();

const fechaOpcionalSchema = z
  .union([z.string().datetime({ offset: true }), z.string().datetime(), z.date()])
  .nullable()
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === '') {
      return null;
    }
    return val instanceof Date ? val : new Date(val);
  });

const camposComercialesSchema = {
  precioMinorista: precioOpcionalSchema,
  precioMayorista: precioOpcionalSchema,
  cantidadMinimaMayorista: z
    .number()
    .int('Debe ser un número entero')
    .positive('La cantidad mínima mayorista debe ser al menos 1')
    .nullable()
    .optional(),
  stockUnidades: z.number().int().nonnegative('Stock inválido').optional(),
  stockComprometidoUnidades: z.number().int().nonnegative('Stock comprometido inválido').optional(),
  unidadStock: unidadStockSchema.optional(),
  ofertaPorcentaje: z
    .number()
    .int()
    .min(0, 'Oferta mínima 0%')
    .max(100, 'Oferta máxima 100%')
    .nullable()
    .optional(),
  ofertaDesde: fechaOpcionalSchema,
  ofertaHasta: fechaOpcionalSchema,
  activoComercial: z.boolean().optional(),
};

function validarRangoOferta(data, ctx) {
  if (data.ofertaDesde && data.ofertaHasta && data.ofertaDesde > data.ofertaHasta) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de inicio de oferta no puede ser posterior a la de fin',
      path: ['ofertaHasta'],
    });
  }
}

export const crearProductoSchema = z
  .object({
    id: z.string().min(1, 'ID obligatorio'),
    nombre: z.string().min(1, 'Nombre obligatorio'),
    categoria: z.string().min(1, 'Categoría obligatoria'),
    descripcion: z.string().optional(),
    imagenUrl: imagenUrlSchema,
    activo: z.boolean().optional().default(true),
    orden: z.number().int().optional().default(0),
    esNuevo: z.boolean().optional(),
    esDestacado: z.boolean().optional(),
    ...camposComercialesSchema,
  })
  .superRefine(validarRangoOferta);

export const actualizarProductoSchema = z
  .object({
    nombre: z.string().min(1, 'Nombre obligatorio').optional(),
    categoria: z.string().min(1, 'Categoría obligatoria').optional(),
    descripcion: z.string().optional().nullable(),
    imagenUrl: imagenUrlSchema.nullable(),
    activo: z.boolean().optional(),
    orden: z.number().int().optional(),
    esNuevo: z.boolean().optional(),
    esDestacado: z.boolean().optional(),
    ...camposComercialesSchema,
  })
  .superRefine(validarRangoOferta);

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});
