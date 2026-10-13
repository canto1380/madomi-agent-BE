import { Cliente } from '../models/Cliente.js';

export async function upsertClientePorTelefonoRepositorio(empresaId, datos) {
  if (!datos.telefonoNormalizado) {
    return null;
  }
  return Cliente.findOneAndUpdate(
    { empresaId, telefonoNormalizado: datos.telefonoNormalizado },
    {
      $set: {
        empresaId,
        telefonoNormalizado: datos.telefonoNormalizado,
        ...(datos.telefono !== undefined ? { telefono: datos.telefono } : {}),
        ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
        ...(datos.apellido !== undefined ? { apellido: datos.apellido } : {}),
        ...(datos.email !== undefined ? { email: datos.email } : {}),
        ...(datos.direccion !== undefined ? { direccion: datos.direccion } : {}),
        ...(datos.localidad !== undefined ? { localidad: datos.localidad } : {}),
        ...(datos.departamento !== undefined ? { departamento: datos.departamento } : {}),
        ...(datos.provincia !== undefined ? { provincia: datos.provincia } : {}),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
}

export async function buscarClientePorIdRepositorio(clienteId) {
  return Cliente.findById(clienteId).lean();
}

export async function buscarClienteIdsPorTextoRepositorio(empresaId, { telefono, nombre }) {
  const condiciones = [];
  if (telefono?.trim()) {
    const t = telefono.trim();
    condiciones.push({ telefono: { $regex: t, $options: 'i' } });
    condiciones.push({ telefonoNormalizado: { $regex: t, $options: 'i' } });
  }
  if (nombre?.trim()) {
    const n = nombre.trim();
    condiciones.push({ nombre: { $regex: n, $options: 'i' } });
    condiciones.push({ apellido: { $regex: n, $options: 'i' } });
  }
  if (condiciones.length === 0) {
    return null;
  }
  const docs = await Cliente.find({ empresaId, $or: condiciones }).select('_id').lean();
  return docs.map((d) => d._id);
}
