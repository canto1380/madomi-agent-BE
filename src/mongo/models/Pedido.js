import mongoose from 'mongoose';

const itemPedidoSchema = new mongoose.Schema(
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

const pedidoSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    presupuestoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Presupuesto', default: null },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
    items: { type: [itemPedidoSchema], default: [] },
    totales: {
      subtotal: { type: Number, default: 0 },
      descuentoTotal: { type: Number, default: 0 },
      costoEnvio: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    estadoLogistico: {
      type: String,
      enum: ['pedido_cerrado', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado'],
      default: 'pedido_cerrado',
    },
    metodoPagoPreferido: { type: String, default: null },
    confirmacionClienteAt: { type: Date, default: null },
    cerradoPor: { type: String, enum: ['agente', 'admin'], default: 'agente' },
    cerradoPorUsuarioId: { type: String, default: null },
    /** comprometido = reserva hasta entrega/cancel; descontado_fisico = baja inmediata al cerrar */
    stockReserva: {
      type: String,
      enum: ['comprometido', 'descontado_fisico'],
      default: null,
    },
  },
  { timestamps: true, collection: 'pedidos' },
);

pedidoSchema.index({ empresaId: 1, estadoLogistico: 1, createdAt: -1 });
pedidoSchema.index({ empresaId: 1, clienteId: 1, createdAt: -1 });
pedidoSchema.index({ empresaId: 1, 'items.productoId': 1 });

export const Pedido = mongoose.models.Pedido ?? mongoose.model('Pedido', pedidoSchema);
