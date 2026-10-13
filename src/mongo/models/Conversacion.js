import mongoose from 'mongoose';

const toolCallSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    argumentsJson: String,
  },
  { _id: false },
);

const mensajeSchema = new mongoose.Schema(
  {
    rol: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    contenido: { type: String, default: '' },
    toolCalls: { type: [toolCallSchema], default: undefined },
    toolResult: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversacionSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
    canal: { type: String, default: 'web_chat' },
    sessionAnonimaId: { type: String, required: true },
    mensajes: { type: [mensajeSchema], default: [] },
    escaladoHumano: { type: Boolean, default: false },
    metadata: {
      userAgent: { type: String, default: null },
      ipHash: { type: String, default: null },
      cursorAgentId: { type: String, default: null },
      contextoChat: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: true, collection: 'conversaciones' },
);

conversacionSchema.index({ empresaId: 1, sessionAnonimaId: 1 });
conversacionSchema.index({ empresaId: 1, leadId: 1 });
conversacionSchema.index({ empresaId: 1, clienteId: 1, updatedAt: -1 });
conversacionSchema.index({ empresaId: 1, updatedAt: -1 });

export const Conversacion =
  mongoose.models.Conversacion ?? mongoose.model('Conversacion', conversacionSchema);
