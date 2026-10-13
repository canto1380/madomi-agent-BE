import mongoose from 'mongoose';

const empresaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: true },
    timezone: { type: String, default: 'America/Argentina/Tucuman' },
    moneda: { type: String, default: 'ARS' },
    vigenciaPresupuestoHoras: { type: Number, default: 72 },
  },
  { timestamps: true, collection: 'empresas' },
);

export const Empresa = mongoose.models.Empresa ?? mongoose.model('Empresa', empresaSchema);
