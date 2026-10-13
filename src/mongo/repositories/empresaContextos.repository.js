import { EmpresaContexto } from '../models/EmpresaContexto.js';

export async function buscarContextoPorHashRepositorio(empresaId, tipo, hash) {
  return EmpresaContexto.findOne({ empresaId, tipo, hash }).lean();
}

export async function cerrarContextosVigentesRepositorio(empresaId, tipo, fechaCierre) {
  return EmpresaContexto.updateMany(
    {
      empresaId,
      tipo,
      $or: [{ vigenteHasta: null }, { vigenteHasta: { $gt: fechaCierre } }],
      vigenteDesde: { $lte: fechaCierre },
    },
    { $set: { vigenteHasta: fechaCierre } },
  );
}

export async function crearContextoRepositorio(datos) {
  const doc = await EmpresaContexto.create(datos);
  return doc.toObject();
}

export async function obtenerContextoVigenteRepositorio(empresaId, tipo) {
  const ahora = new Date();
  return EmpresaContexto.findOne({
    empresaId,
    tipo,
    vigenteDesde: { $lte: ahora },
    $or: [{ vigenteHasta: null }, { vigenteHasta: { $gt: ahora } }],
  })
    .sort({ vigenteDesde: -1 })
    .lean();
}

export async function listarContextosRepositorio(empresaId, { tipo, limit = 20 } = {}) {
  const filtro = { empresaId };
  if (tipo) {
    filtro.tipo = tipo;
  }
  return EmpresaContexto.find(filtro).sort({ vigenteDesde: -1 }).limit(limit).lean();
}
