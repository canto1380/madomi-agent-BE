import { Presupuesto } from '../models/Presupuesto.js';

export async function listarPresupuestosAdminRepositorio(empresaId, { filtro, sort, skip, limit }) {
  return Presupuesto.find({ empresaId, ...filtro })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function contarPresupuestosAdminRepositorio(empresaId, filtro) {
  return Presupuesto.countDocuments({ empresaId, ...filtro });
}

export async function buscarPresupuestoPorIdRepositorio(presupuestoId, empresaId) {
  return Presupuesto.findOne({ _id: presupuestoId, empresaId }).lean();
}

export async function buscarPresupuestoBorradorPorLeadRepositorio(empresaId, leadId) {
  return Presupuesto.findOne({ empresaId, leadId, estado: 'borrador' })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function upsertPresupuestoBorradorRepositorio(datos) {
  const existente = await Presupuesto.findOne({
    empresaId: datos.empresaId,
    leadId: datos.leadId,
    estado: 'borrador',
  }).sort({ updatedAt: -1 });

  const payload = {
    ...datos,
    estado: 'borrador',
    generadoPor: 'agente',
  };

  if (existente) {
    existente.set(payload);
    await existente.save();
    return existente.toObject();
  }

  const doc = await Presupuesto.create(payload);
  return doc.toObject();
}

export async function buscarUltimoPresupuestoPorLeadRepositorio(empresaId, leadId) {
  return Presupuesto.findOne({ empresaId, leadId }).sort({ updatedAt: -1 }).lean();
}

export async function actualizarPresupuestoPorIdRepositorio(presupuestoId, empresaId, update) {
  return Presupuesto.findOneAndUpdate(
    { _id: presupuestoId, empresaId },
    { $set: update },
    { returnDocument: 'after' },
  ).lean();
}
