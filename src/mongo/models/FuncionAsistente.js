import mongoose from 'mongoose';

const funcionAsistenteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    version: { type: String, required: true, default: '1' },
    descripcion: { type: String, required: true },
    parametersJsonSchema: { type: mongoose.Schema.Types.Mixed, required: true },
    handlerInterno: { type: String, required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'funciones_asistente' },
);

funcionAsistenteSchema.index({ nombre: 1, version: 1 }, { unique: true });

export const FuncionAsistente =
  mongoose.models.FuncionAsistente ?? mongoose.model('FuncionAsistente', funcionAsistenteSchema);
