import { Lead } from '../models/Lead.js';

export async function listarLeadsAdminRepositorio(empresaId, { filtro, sort, skip, limit }) {
  return Lead.find({ empresaId, ...filtro })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function contarLeadsAdminRepositorio(empresaId, filtro) {
  return Lead.countDocuments({ empresaId, ...filtro });
}

export async function buscarLeadPorIdEmpresaRepositorio(leadId, empresaId) {
  return Lead.findOne({ _id: leadId, empresaId }).lean();
}

export async function aggregateEmbudoLeadsRepositorio(empresaId) {
  return Lead.aggregate([
    { $match: { empresaId } },
    { $group: { _id: '$estado', total: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
}

export async function aggregateProductosInteresLeadsRepositorio(empresaId, { limit = 10 } = {}) {
  return Lead.aggregate([
    { $match: { empresaId } },
    { $unwind: '$productosInteres' },
    {
      $group: {
        _id: '$productosInteres.productoId',
        nombre: { $first: '$productosInteres.nombreSnapshot' },
        total: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);
}

export async function aggregateLocalidadesLeadsRepositorio(empresaId, { limit = 10 } = {}) {
  return Lead.aggregate([
    {
      $match: {
        empresaId,
        localidad: { $nin: [null, ''] },
      },
    },
    { $group: { _id: '$localidad', total: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);
}

export async function aggregateCuellosBotellaLeadsRepositorio(empresaId) {
  return Lead.aggregate([
    {
      $match: {
        empresaId,
        cuelloBotella: { $ne: null },
      },
    },
    { $group: { _id: '$cuelloBotella', total: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
}

export async function aggregateAbandonoLeadsRepositorio(empresaId, { limit = 10 } = {}) {
  return Lead.aggregate([
    {
      $match: {
        empresaId,
        estado: 'abandonado',
        motivoAbandono: { $nin: [null, ''] },
      },
    },
    { $group: { _id: '$motivoAbandono', total: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);
}

export async function contarLeadsPorEstadoRepositorio(empresaId, estado) {
  return Lead.countDocuments({ empresaId, estado });
}

export async function crearLeadRepositorio(datos) {
  const doc = await Lead.create(datos);
  return doc.toObject();
}

export async function actualizarLeadRepositorio(leadId, update) {
  return Lead.findByIdAndUpdate(leadId, { $set: update }, { returnDocument: 'after' }).lean();
}

export async function buscarLeadPorIdRepositorio(leadId) {
  return Lead.findById(leadId).lean();
}

export async function mergeDatosCapturadosLeadRepositorio(leadId, parcial) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    return null;
  }
  lead.datosCapturados = { ...(lead.datosCapturados ?? {}), ...parcial };
  if (parcial.localidad) {
    lead.localidad = parcial.localidad;
  }
  if (parcial.departamento) {
    lead.departamento = parcial.departamento;
  }
  lead.ultimoMensajeAt = new Date();
  await lead.save();
  return lead.toObject();
}

export async function agregarProductoInteresLeadRepositorio(leadId, producto) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    return null;
  }
  const existe = lead.productosInteres.some((p) => p.productoId === producto.productoId);
  if (!existe) {
    lead.productosInteres.push(producto);
  }
  if (lead.estado === 'nuevo') {
    lead.estado = 'consultando';
  }
  lead.ultimoMensajeAt = new Date();
  await lead.save();
  return lead.toObject();
}
