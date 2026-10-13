import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
    nombre: { type: String, default: null },
    apellido: { type: String, default: null },
    email: { type: String, default: null },
    telefono: { type: String, default: null },
    telefonoNormalizado: { type: String, default: null },
    direccion: { type: String, default: null },
    localidad: { type: String, default: null },
    departamento: { type: String, default: null },
    provincia: { type: String, default: 'Tucumán' },
    esMayorista: { type: Boolean, default: false },
    cuit: { type: String, default: null },
    preferencias: {
      sinPromociones: { type: Boolean, default: false },
    },
    postgresUsuarioId: { type: String, default: null },
  },
  { timestamps: true, collection: 'clientes' },
);

clienteSchema.index({ empresaId: 1, telefonoNormalizado: 1 }, { unique: true, sparse: true });
clienteSchema.index({ empresaId: 1, email: 1 }, { sparse: true });
clienteSchema.index({ empresaId: 1, localidad: 1, departamento: 1 });

export const Cliente = mongoose.models.Cliente ?? mongoose.model('Cliente', clienteSchema);
