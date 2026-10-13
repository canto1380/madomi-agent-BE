import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    chunkId: { type: String, required: true },
    titulo: { type: String, required: true },
    texto: { type: String, required: true },
    embedding: { type: [Number], default: undefined },
  },
  { _id: false },
);

const empresaContextoSchema = new mongoose.Schema(
  {
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
    tipo: {
      type: String,
      required: true,
      enum: ['politicas_entrega', 'faq_comercial', 'tono_marca'],
    },
    version: { type: String, required: true },
    markdown: { type: String, required: true },
    hash: { type: String, required: true },
    origenPdfUrl: { type: String, default: null },
    vigenteDesde: { type: Date, required: true },
    vigenteHasta: { type: Date, default: null },
    chunks: { type: [chunkSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'empresa_contextos' },
);

empresaContextoSchema.index({ empresaId: 1, tipo: 1, vigenteDesde: -1 });
empresaContextoSchema.index({ empresaId: 1, tipo: 1, vigenteHasta: 1 });
empresaContextoSchema.index({ empresaId: 1, tipo: 1, hash: 1 });

export const EmpresaContexto =
  mongoose.models.EmpresaContexto ?? mongoose.model('EmpresaContexto', empresaContextoSchema);
