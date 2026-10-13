import { AgenteRun } from '../models/AgenteRun.js';

export async function crearAgenteRunRepositorio(datos) {
  const doc = await AgenteRun.create(datos);
  return doc.toObject();
}
