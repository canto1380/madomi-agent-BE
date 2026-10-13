import mongoose from 'mongoose';

const itemPresupuestoSchema = new mongoose.Schema(
  {
    productoId: String,
    nombreSnapshot: String,
    cantidad: Number,
    unidad: String,
    precioUnitarioSnapshot: Number,
    descuentoPorcentaje: Number,
    subtotalLinea: Number,
  },
  { _id: false },
);

const presupuestoSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
    conversacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversacion', default: null },
    items: { type: [itemPresupuestoSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    descuentoTotal: { type: Number, default: 0 },
    costoEnvio: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    moneda: { type: String, default: 'ARS' },
    estado: {
      type: String,
      enum: ['borrador', 'enviado', 'aceptado', 'vencido', 'rechazado'],
      default: 'borrador',
    },
    pdfUrl: { type: String, default: null },
    validezHasta: { type: Date, default: null },
    generadoPor: { type: String, enum: ['agente', 'admin'], default: 'agente' },
  },
  { timestamps: true, collection: 'presupuestos' },
);

presupuestoSchema.index({ empresaId: 1, estado: 1, createdAt: -1 });
presupuestoSchema.index({ empresaId: 1, clienteId: 1, createdAt: -1 });
presupuestoSchema.index({ leadId: 1 });
presupuestoSchema.index({ validezHasta: 1, estado: 1 });

export const Presupuesto =
  mongoose.models.Presupuesto ?? mongoose.model('Presupuesto', presupuestoSchema);
