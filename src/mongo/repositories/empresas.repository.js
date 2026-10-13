import { Empresa } from '../models/Empresa.js';

export async function buscarEmpresaPorSlugRepositorio(slug) {
  return Empresa.findOne({ slug }).lean();
}

export async function buscarEmpresaPorIdRepositorio(empresaId) {
  return Empresa.findById(empresaId).lean();
}

export async function upsertEmpresaPorSlugRepositorio(slug, datos) {
  return Empresa.findOneAndUpdate(
    { slug },
    { $set: { slug, ...datos } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
}
