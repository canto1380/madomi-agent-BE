import { AppError } from '../errors/AppError.js';
import { parsearFiltroActivo, parsearOrdenAdmin } from '../utils/adminResponder.js';
import {
  listarMediaActivosRepositorio,
  listarMediaAdminRepositorio,
  buscarMediaPorIdRepositorio,
  buscarMediaPorClaveRepositorio,
  crearMediaRepositorio,
  actualizarMediaRepositorio,
  bajaLogicaMediaRepositorio,
} from '../repositories/media.repository.js';
import { deleteStorageFile, extractStoragePath } from './storage.service.js';

const CAMPOS_ORDEN = ['clave', 'tipo', 'url', 'orden', 'activo', 'createdAt', 'updatedAt'];

function mapearMediaPublica(m) {
  return {
    clave: m.clave,
    tipo: m.tipo,
    url: m.url,
    ...(m.alt ? { alt: m.alt } : {}),
    orden: m.orden,
  };
}

function mapearMediaAdmin(m) {
  return {
    id: m.id,
    clave: m.clave,
    tipo: m.tipo,
    url: m.url,
    alt: m.alt,
    orden: m.orden,
    activo: m.activo,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

const asegurarMediaExiste = async (id) => {
  const media = await buscarMediaPorIdRepositorio(id);
  if (!media) throw new AppError('Media no encontrado', 404, 'NOT_FOUND');
  return media;
};

export async function listarMediaServicio() {
  const rows = await listarMediaActivosRepositorio();
  return rows.map(mapearMediaPublica);
}

export async function listarMediaAdminServicio(query = {}) {
  const { sort, order } = parsearOrdenAdmin(query, CAMPOS_ORDEN);
  const rows = await listarMediaAdminRepositorio({
    search: query.search?.trim() || undefined,
    activo: parsearFiltroActivo(query),
    tipo: query.tipo?.trim() || undefined,
    sort,
    order,
  });
  return rows.map(mapearMediaAdmin);
}

export async function obtenerMediaAdminServicio(id) {
  const media = await asegurarMediaExiste(id);
  return mapearMediaAdmin(media);
}

export async function crearMediaServicio(data) {
  const existente = await buscarMediaPorClaveRepositorio(data.clave);
  if (existente) throw new AppError('Ya existe un media con esa clave', 409, 'CONFLICT');

  const media = await crearMediaRepositorio({
    clave: data.clave,
    tipo: data.tipo,
    url: data.url,
    alt: data.alt ?? null,
    orden: data.orden ?? 0,
    activo: data.activo ?? true,
  });
  return mapearMediaAdmin(media);
}

export async function actualizarMediaServicio(id, data) {
  const existente = await asegurarMediaExiste(id);

  if (data.clave) {
    const duplicado = await buscarMediaPorClaveRepositorio(data.clave);
    if (duplicado && duplicado.id !== id) {
      throw new AppError('Ya existe un media con esa clave', 409, 'CONFLICT');
    }
  }

  if (
    data.url &&
    data.url !== existente.url &&
    extractStoragePath(existente.url)
  ) {
    try {
      await deleteStorageFile(existente.url);
    } catch (deleteError) {
      console.warn('[media] No se pudo borrar archivo anterior:', deleteError.message);
    }
  }

  const media = await actualizarMediaRepositorio(id, data);
  return mapearMediaAdmin(media);
}

export async function eliminarMediaServicio(id) {
  await asegurarMediaExiste(id);
  const media = await bajaLogicaMediaRepositorio(id);
  return mapearMediaAdmin(media);
}
