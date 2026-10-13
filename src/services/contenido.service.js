import { AppError } from '../errors/AppError.js';
import { parsearFiltroActivo, parsearOrdenAdmin } from '../utils/adminResponder.js';
import { mapearContenidoPublico } from '../utils/contenidoMapper.js';
import {
  listarContenidoActivoRepositorio,
  listarContenidoPorSeccionRepositorio,
  listarContenidoAdminRepositorio,
  buscarContenidoPorIdRepositorio,
  buscarContenidoPorClaveRepositorio,
  crearContenidoRepositorio,
  actualizarContenidoRepositorio,
  bajaLogicaContenidoRepositorio,
} from '../repositories/contenido.repository.js';

const CAMPOS_ORDEN = ['clave', 'valor', 'seccion', 'tipo', 'orden', 'activo', 'createdAt', 'updatedAt'];

function mapearContenidoAdmin(item) {
  return {
    id: item.id,
    clave: item.clave,
    valor: item.valor,
    seccion: item.seccion,
    tipo: item.tipo,
    orden: item.orden,
    activo: item.activo,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

const asegurarContenidoExiste = async (id) => {
  const item = await buscarContenidoPorIdRepositorio(id);
  if (!item) throw new AppError('Texto no encontrado', 404, 'NOT_FOUND');
  return item;
};

export async function obtenerContenidoPublicoServicio() {
  const textos = await listarContenidoActivoRepositorio();
  return mapearContenidoPublico(textos);
}

export async function obtenerContenidoPorSeccionServicio(seccion) {
  const textos = await listarContenidoPorSeccionRepositorio(seccion);
  return textos.map((t) => ({ clave: t.clave, valor: t.valor, orden: t.orden }));
}

export async function listarContenidoAdminServicio(query = {}) {
  const { sort, order } = parsearOrdenAdmin(query, CAMPOS_ORDEN);
  const rows = await listarContenidoAdminRepositorio({
    search: query.search?.trim() || undefined,
    activo: parsearFiltroActivo(query),
    seccion: query.seccion?.trim() || undefined,
    sort,
    order,
  });
  return rows.map(mapearContenidoAdmin);
}

export async function obtenerContenidoAdminServicio(id) {
  const item = await asegurarContenidoExiste(id);
  return mapearContenidoAdmin(item);
}

export async function crearContenidoServicio(data) {
  const existente = await buscarContenidoPorClaveRepositorio(data.clave);
  if (existente) throw new AppError('Ya existe un texto con esa clave', 409, 'CONFLICT');

  const item = await crearContenidoRepositorio({
    clave: data.clave,
    valor: data.valor,
    seccion: data.seccion,
    tipo: data.tipo ?? 'texto',
    orden: data.orden ?? 0,
    activo: data.activo ?? true,
  });
  return mapearContenidoAdmin(item);
}

export async function actualizarContenidoServicio(id, data) {
  await asegurarContenidoExiste(id);

  if (data.clave) {
    const existente = await buscarContenidoPorClaveRepositorio(data.clave);
    if (existente && existente.id !== id) {
      throw new AppError('Ya existe un texto con esa clave', 409, 'CONFLICT');
    }
  }

  const item = await actualizarContenidoRepositorio(id, data);
  return mapearContenidoAdmin(item);
}

export async function eliminarContenidoServicio(id) {
  await asegurarContenidoExiste(id);
  const item = await bajaLogicaContenidoRepositorio(id);
  return mapearContenidoAdmin(item);
}
