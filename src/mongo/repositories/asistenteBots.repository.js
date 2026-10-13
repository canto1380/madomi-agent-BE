import { AsistenteBot } from '../models/AsistenteBot.js';

export async function upsertAsistenteBotRepositorio(empresaId, datos) {
  return AsistenteBot.findOneAndUpdate(
    { empresaId },
    { $set: { empresaId, ...datos } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
}

export async function obtenerAsistenteBotPorEmpresaRepositorio(empresaId) {
  return AsistenteBot.findOne({ empresaId }).lean();
}

export async function actualizarAsistenteBotRepositorio(empresaId, patch) {
  return AsistenteBot.findOneAndUpdate(
    { empresaId },
    { $set: patch },
    { returnDocument: 'after' },
  ).lean();
}
