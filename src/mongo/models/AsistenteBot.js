import mongoose from 'mongoose';

const asistenteBotSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, unique: true },
    nombre: { type: String, default: 'Asistente Madomi' },
    modelo: { type: String, default: 'gpt-4.1-mini' },
    temperature: { type: Number, default: 0.4 },
    systemPromptVersion: { type: String, default: 'v1' },
    toolsHabilitadas: { type: [String], default: [] },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'asistente_bots' },
);

export const AsistenteBot =
  mongoose.models.AsistenteBot ?? mongoose.model('AsistenteBot', asistenteBotSchema);
