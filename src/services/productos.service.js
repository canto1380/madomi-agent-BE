import { AppError } from '../errors/AppError.js';
import {
  listarProductosActivosRepositorio,
  listarProductosAdminRepositorio,
  buscarProductoPorIdRepositorio,
  crearProductoRepositorio,
  actualizarProductoRepositorio,
  bajaLogicaProductoRepositorio,
} from '../repositories/productos.repository.js';
import { sincronizarDestacadosProducto } from './destacados.service.js';
import { deleteStorageFile, extractStoragePath } from './storage.service.js';
import { extraerFlagsDestacados } from '../utils/productoDestacados.js';

const CAMPOS_ORDEN_ADMIN = [
  'nombre',
  'categoria',
  'orden',
  'activo',
  'stockUnidades',
  'activoComercial',
  'createdAt',
  'updatedAt',
];

function decimalANumero(valor) {
  if (valor == null) {
    return null;
  }
  return Number(valor);
}

function mapearProductoPublico(producto) {
  const flags = extraerFlagsDestacados(producto.destacados);
  return {
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    ...(producto.descripcion ? { descripcion: producto.descripcion } : {}),
    ...(producto.imagenUrl ? { imagenUrl: producto.imagenUrl } : {}),
    ...flags,
  };
}

function mapearProductoAdmin(producto) {
  const flags = extraerFlagsDestacados(producto.destacados);
  return {
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    descripcion: producto.descripcion,
    imagenUrl: producto.imagenUrl,
    activo: producto.activo,
    orden: producto.orden,
    precioMinorista: decimalANumero(producto.precioMinorista),
    precioMayorista: decimalANumero(producto.precioMayorista),
    cantidadMinimaMayorista: producto.cantidadMinimaMayorista,
    stockUnidades: producto.stockUnidades,
    stockComprometidoUnidades: producto.stockComprometidoUnidades ?? 0,
    stockDisponible: Math.max(
      0,
      (producto.stockUnidades ?? 0) - (producto.stockComprometidoUnidades ?? 0),
    ),
    unidadStock: producto.unidadStock,
    ofertaPorcentaje: producto.ofertaPorcentaje,
    ofertaDesde: producto.ofertaDesde,
    ofertaHasta: producto.ofertaHasta,
    activoComercial: producto.activoComercial,
    ...flags,
    createdAt: producto.createdAt,
    updatedAt: producto.updatedAt,
  };
}

function normalizarImagenUrl(imagenUrl) {
  if (imagenUrl === '' || imagenUrl === null) {
    return null;
  }
  return imagenUrl;
}

function separarPayloadProducto(data) {
  const { esNuevo, esDestacado, ...productoData } = data;
  return { productoData, esNuevo, esDestacado };
}

function parsearFiltrosAdmin(query = {}) {
  const filtros = {
    search: query.search?.trim() || undefined,
    categoria: query.categoria?.trim() || undefined,
    sort: CAMPOS_ORDEN_ADMIN.includes(query.sort) ? query.sort : undefined,
    order: query.order === 'desc' ? 'desc' : 'asc',
  };

  if (query.activo === 'true') {
    filtros.activo = true;
  } else if (query.activo === 'false') {
    filtros.activo = false;
  }

  return filtros;
}

const asegurarProductoExiste = async (id) => {
  const producto = await buscarProductoPorIdRepositorio(id);
  if (!producto) {
    throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
  }
  return producto;
};

async function recargarProductoAdmin(id) {
  const producto = await buscarProductoPorIdRepositorio(id);
  return mapearProductoAdmin(producto);
}

export async function listarProductosServicio() {
  const productos = await listarProductosActivosRepositorio();
  return productos.map(mapearProductoPublico);
}

export async function listarProductosAdminServicio(query = {}) {
  const filtros = parsearFiltrosAdmin(query);
  const productos = await listarProductosAdminRepositorio(filtros);
  return productos.map(mapearProductoAdmin);
}

export async function obtenerProductoAdminServicio(id) {
  const producto = await asegurarProductoExiste(id);
  return mapearProductoAdmin(producto);
}

export async function crearProductoServicio(data) {
  const existente = await buscarProductoPorIdRepositorio(data.id);
  if (existente) {
    throw new AppError('Ya existe un producto con ese ID', 409, 'CONFLICT');
  }

  const { productoData, esNuevo, esDestacado } = separarPayloadProducto(data);

  const producto = await crearProductoRepositorio({
    id: productoData.id,
    nombre: productoData.nombre,
    categoria: productoData.categoria,
    descripcion: productoData.descripcion ?? null,
    imagenUrl: normalizarImagenUrl(productoData.imagenUrl),
    activo: productoData.activo ?? true,
    orden: productoData.orden ?? 0,
    precioMinorista: productoData.precioMinorista ?? null,
    precioMayorista: productoData.precioMayorista ?? null,
    cantidadMinimaMayorista: productoData.cantidadMinimaMayorista ?? null,
    stockUnidades: productoData.stockUnidades ?? 0,
    unidadStock: productoData.unidadStock ?? 'un',
    ofertaPorcentaje: productoData.ofertaPorcentaje ?? null,
    ofertaDesde: productoData.ofertaDesde ?? null,
    ofertaHasta: productoData.ofertaHasta ?? null,
    activoComercial: productoData.activoComercial ?? true,
  });

  if (esNuevo !== undefined || esDestacado !== undefined) {
    await sincronizarDestacadosProducto(producto.id, { esNuevo, esDestacado });
    return recargarProductoAdmin(producto.id);
  }

  return mapearProductoAdmin(producto);
}

export async function actualizarProductoServicio(id, data) {
  const existente = await asegurarProductoExiste(id);
  const { productoData, esNuevo, esDestacado } = separarPayloadProducto(data);

  const payload = { ...productoData };
  if ('imagenUrl' in payload) {
    payload.imagenUrl = normalizarImagenUrl(payload.imagenUrl);
  }

  if (
    payload.imagenUrl &&
    payload.imagenUrl !== existente.imagenUrl &&
    extractStoragePath(existente.imagenUrl)
  ) {
    try {
      await deleteStorageFile(existente.imagenUrl);
    } catch (deleteError) {
      console.warn('[productos] No se pudo borrar imagen anterior:', deleteError.message);
    }
  }

  await actualizarProductoRepositorio(id, payload);

  if (esNuevo !== undefined || esDestacado !== undefined) {
    await sincronizarDestacadosProducto(id, { esNuevo, esDestacado });
  }

  return recargarProductoAdmin(id);
}

export async function eliminarProductoServicio(id) {
  await asegurarProductoExiste(id);
  const producto = await bajaLogicaProductoRepositorio(id);
  return mapearProductoAdmin(producto);
}
