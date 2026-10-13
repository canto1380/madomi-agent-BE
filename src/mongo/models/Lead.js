import mongoose from 'mongoose';

const productoInteresSchema = new mongoose.Schema(
  {
    productoId: String,
    nombreSnapshot: String,
    categoriaSnapshot: String,
  },
  { _id: false },
);

const ESTADOS_LEAD = [
  'nuevo',
  'consultando',
  'presupuesto_abierto',
  'presupuesto_enviado',
  'pedido_cerrado',
  'abandonado',
  'pendiente_validacion_logistica',
];

const leadSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
    conversacionIdActiva: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversacion', default: null },
    estado: { type: String, enum: ESTADOS_LEAD, default: 'nuevo' },
    datosCapturados: { type: mongoose.Schema.Types.Mixed, default: {} },
    productosInteres: { type: [productoInteresSchema], default: [] },
    localidad: { type: String, default: null },
    departamento: { type: String, default: null },
    cuelloBotella: {
      type: String,
      enum: ['precio', 'envio', 'stock', 'solo_consulta', 'otro'],
      default: undefined,
    },
    motivoAbandono: { type: String, default: null },
    asignadoAUsuarioId: { type: String, default: null },
    requiereContactoComercial: { type: Boolean, default: false, index: true },
    ultimoMensajeAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'leads' },
);

leadSchema.index({ empresaId: 1, estado: 1, updatedAt: -1 });
leadSchema.index({ empresaId: 1, ultimoMensajeAt: -1 });
leadSchema.index({ empresaId: 1, clienteId: 1 });
leadSchema.index({ empresaId: 1, 'productosInteres.productoId': 1 });
leadSchema.index({ asignadoAUsuarioId: 1, estado: 1 });

export const Lead = mongoose.models.Lead ?? mongoose.model('Lead', leadSchema);
