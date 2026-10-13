import mongoose from 'mongoose';

const agenteRunSchema = new mongoose.Schema(
  {
    conversacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversacion', required: true },
    mensajeUsuarioId: { type: String, default: null },
    modelo: { type: String, required: true },
    tokensEntrada: { type: Number, default: 0 },
    tokensSalida: { type: Number, default: 0 },
    latenciaMs: { type: Number, default: 0 },
    toolCallsCount: { type: Number, default: 0 },
    error: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'agente_runs' },
);

agenteRunSchema.index({ conversacionId: 1, createdAt: -1 });
agenteRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const AgenteRun = mongoose.models.AgenteRun ?? mongoose.model('AgenteRun', agenteRunSchema);
