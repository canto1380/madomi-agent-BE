import { AppError } from '../errors/AppError.js';
import { parsearFiltroActivo, parsearOrdenAdmin } from '../utils/adminResponder.js';
import { SECCION_DESTACADO, SECCION_NUEVO } from '../utils/productoDestacados.js';
import { buscarProductoPorIdRepositorio } from '../repositories/productos.repository.js';
import {
  listarDestacadosActivosRepositorio,
  listarDestacadosAdminRepositorio,
  buscarDestacadoPorIdRepositorio,
  buscarDestacadoPorProductoSeccionRepositorio,
  crearDestacadoRepositorio,
  actualizarDestacadoRepositorio,
  bajaLogicaDestacadoRepositorio,
} from '../repositories/destacados.repository.js';

const CAMPOS_ORDEN = ['productoId', 'seccion', 'orden', 'activo', 'createdAt', 'updatedAt'];

function mapearProductoDestacadoPublico(destacado) {
  const p = destacado.producto;
  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    ...(p.descripcion ? { descripcion: p.descripcion } : {}),
    ...(p.imagenUrl ? { imagenUrl: p.imagenUrl } : {}),
  };
}

function mapearDestacadoAdmin(destacado) {
  return {
    id: destacado.id,
    productoId: destacado.productoId,
    seccion: destacado.seccion,
    orden: destacado.orden,
    activo: destacado.activo,
    producto: destacado.producto
      ? {
          id: destacado.producto.id,
          nombre: destacado.producto.nombre,
          categoria: destacado.producto.categoria,
          activo: destacado.producto.activo,
        }
      : null,
    createdAt: destacado.createdAt,
    updatedAt: destacado.updatedAt,
  };
}

const asegurarDestacadoExiste = async (id) => {
  const destacado = await buscarDestacadoPorIdRepositorio(id);
  if (!destacado) throw new AppError('Destacado no encontrado', 404, 'NOT_FOUND');
  return destacado;
};

const asegurarProductoExiste = async (productoId) => {
  const producto = await buscarProductoPorIdRepositorio(productoId);
  if (!producto) throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
  return producto;
};

export async function listarDestacadosPublicoServicio(seccion = 'lo_ultimo') {
  const rows = await listarDestacadosActivosRepositorio(seccion);
  return rows.map(mapearProductoDestacadoPublico);
}

export async function listarDestacadosAdminServicio(query = {}) {
  const { sort, order } = parsearOrdenAdmin(query, CAMPOS_ORDEN);
  const rows = await listarDestacadosAdminRepositorio({
    search: query.search?.trim() || undefined,
    activo: parsearFiltroActivo(query),
    seccion: query.seccion?.trim() || undefined,
    sort,
    order,
  });
  return rows.map(mapearDestacadoAdmin);
}

export async function obtenerDestacadoAdminServicio(id) {
  const destacado = await asegurarDestacadoExiste(id);
  return mapearDestacadoAdmin(destacado);
}

export async function crearDestacadoServicio(data) {
  await asegurarProductoExiste(data.productoId);
  const seccion = data.seccion ?? 'lo_ultimo';

  const existente = await buscarDestacadoPorProductoSeccionRepositorio(data.productoId, seccion);
  if (existente) {
    throw new AppError('El producto ya está destacado en esa sección', 409, 'CONFLICT');
  }

  const destacado = await crearDestacadoRepositorio({
    productoId: data.productoId,
    seccion,
    orden: data.orden ?? 0,
    activo: data.activo ?? true,
  });
  return mapearDestacadoAdmin(destacado);
}

export async function actualizarDestacadoServicio(id, data) {
  const actual = await asegurarDestacadoExiste(id);

  if (data.productoId) await asegurarProductoExiste(data.productoId);

  const productoId = data.productoId ?? actual.productoId;
  const seccion = data.seccion ?? actual.seccion;

  if (data.productoId || data.seccion) {
    const existente = await buscarDestacadoPorProductoSeccionRepositorio(productoId, seccion);
    if (existente && existente.id !== id) {
      throw new AppError('El producto ya está destacado en esa sección', 409, 'CONFLICT');
    }
  }

  const destacado = await actualizarDestacadoRepositorio(id, data);
  return mapearDestacadoAdmin(destacado);
}

export async function eliminarDestacadoServicio(id) {
  await asegurarDestacadoExiste(id);
  const destacado = await bajaLogicaDestacadoRepositorio(id);
  return mapearDestacadoAdmin(destacado);
}

async function activarDestacadoProducto(productoId, seccion) {
  const existente = await buscarDestacadoPorProductoSeccionRepositorio(productoId, seccion);

  if (existente) {
    if (!existente.activo) {
      await actualizarDestacadoRepositorio(existente.id, { activo: true });
    }
    return;
  }

  await crearDestacadoRepositorio({
    productoId,
    seccion,
    orden: 0,
    activo: true,
  });
}

async function desactivarDestacadoProducto(productoId, seccion) {
  const existente = await buscarDestacadoPorProductoSeccionRepositorio(productoId, seccion);
  if (existente?.activo) {
    await bajaLogicaDestacadoRepositorio(existente.id);
  }
}

export async function sincronizarDestacadosProducto(productoId, { esNuevo, esDestacado } = {}) {
  if (esNuevo !== undefined) {
    if (esNuevo) {
      await activarDestacadoProducto(productoId, SECCION_NUEVO);
    } else {
      await desactivarDestacadoProducto(productoId, SECCION_NUEVO);
    }
  }

  if (esDestacado !== undefined) {
    if (esDestacado) {
      await activarDestacadoProducto(productoId, SECCION_DESTACADO);
    } else {
      await desactivarDestacadoProducto(productoId, SECCION_DESTACADO);
    }
  }
}
