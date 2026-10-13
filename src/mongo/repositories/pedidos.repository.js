import { Pedido } from '../models/Pedido.js';

export async function listarPedidosAdminRepositorio(empresaId, { filtro, sort, skip, limit }) {
  return Pedido.find({ empresaId, ...filtro })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function contarPedidosAdminRepositorio(empresaId, filtro) {
  return Pedido.countDocuments({ empresaId, ...filtro });
}

export async function buscarPedidoPorIdRepositorio(pedidoId, empresaId) {
  return Pedido.findOne({ _id: pedidoId, empresaId }).lean();
}

export async function actualizarPedidoRepositorio(pedidoId, empresaId, update) {
  return Pedido.findOneAndUpdate({ _id: pedidoId, empresaId }, { $set: update }, { returnDocument: 'after' }).lean();
}

export async function crearPedidoRepositorio(datos) {
  const doc = await Pedido.create(datos);
  return doc.toObject();
}
