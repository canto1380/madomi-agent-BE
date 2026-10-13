import { AppError } from '../errors/AppError.js';
import { parsearFiltroActivo, parsearOrdenAdmin } from '../utils/adminResponder.js';
import {
  listarRedesActivasRepositorio,
  listarRedesAdminRepositorio,
  buscarRedPorIdRepositorio,
  crearRedRepositorio,
  actualizarRedRepositorio,
  bajaLogicaRedRepositorio,
} from '../repositories/redes.repository.js';

const CAMPOS_ORDEN = ['plataforma', 'url', 'orden', 'activo', 'createdAt', 'updatedAt'];

function mapearRedPublica(r) {
  return { id: r.id, plataforma: r.plataforma, url: r.url, orden: r.orden };
}

function mapearRedAdmin(r) {
  return {
    id: r.id,
    plataforma: r.plataforma,
    url: r.url,
    orden: r.orden,
    activo: r.activo,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

const asegurarRedExiste = async (id) => {
  const red = await buscarRedPorIdRepositorio(id);
  if (!red) throw new AppError('Red social no encontrada', 404, 'NOT_FOUND');
  return red;
};

export async function listarRedesServicio() {
  const rows = await listarRedesActivasRepositorio();
  return rows.map(mapearRedPublica);
}

export async function listarRedesAdminServicio(query = {}) {
  const { sort, order } = parsearOrdenAdmin(query, CAMPOS_ORDEN);
  const rows = await listarRedesAdminRepositorio({
    search: query.search?.trim() || undefined,
    activo: parsearFiltroActivo(query),
    sort,
    order,
  });
  return rows.map(mapearRedAdmin);
}

export async function obtenerRedAdminServicio(id) {
  const red = await asegurarRedExiste(id);
  return mapearRedAdmin(red);
}

export async function crearRedServicio(data) {
  const red = await crearRedRepositorio({
    plataforma: data.plataforma,
    url: data.url,
    orden: data.orden ?? 0,
    activo: data.activo ?? true,
  });
  return mapearRedAdmin(red);
}

export async function actualizarRedServicio(id, data) {
  await asegurarRedExiste(id);
  const red = await actualizarRedRepositorio(id, data);
  return mapearRedAdmin(red);
}

export async function eliminarRedServicio(id) {
  await asegurarRedExiste(id);
  const red = await bajaLogicaRedRepositorio(id);
  return mapearRedAdmin(red);
}
