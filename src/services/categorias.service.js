import { AppError } from '../errors/AppError.js';
import { parsearFiltroActivo, parsearOrdenAdmin } from '../utils/adminResponder.js';
import { slugify } from '../utils/slugify.js';
import {
  listarCategoriasActivasRepositorio,
  listarCategoriasAdminRepositorio,
  buscarCategoriaPorIdRepositorio,
  buscarCategoriaPorSlugRepositorio,
  crearCategoriaRepositorio,
  actualizarCategoriaRepositorio,
  bajaLogicaCategoriaRepositorio,
} from '../repositories/categorias.repository.js';

const CAMPOS_ORDEN = ['nombre', 'slug', 'orden', 'activo', 'createdAt', 'updatedAt'];

function mapearCategoriaPublica(c) {
  return { id: c.id, nombre: c.nombre, slug: c.slug, orden: c.orden };
}

function mapearCategoriaAdmin(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    orden: c.orden,
    activo: c.activo,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

const asegurarCategoriaExiste = async (id) => {
  const categoria = await buscarCategoriaPorIdRepositorio(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404, 'NOT_FOUND');
  return categoria;
};

export async function listarCategoriasServicio() {
  const rows = await listarCategoriasActivasRepositorio();
  return rows.map(mapearCategoriaPublica);
}

export async function listarCategoriasAdminServicio(query = {}) {
  const { sort, order } = parsearOrdenAdmin(query, CAMPOS_ORDEN);
  const rows = await listarCategoriasAdminRepositorio({
    search: query.search?.trim() || undefined,
    activo: parsearFiltroActivo(query),
    sort,
    order,
  });
  return rows.map(mapearCategoriaAdmin);
}

export async function obtenerCategoriaAdminServicio(id) {
  const categoria = await asegurarCategoriaExiste(id);
  return mapearCategoriaAdmin(categoria);
}

export async function crearCategoriaServicio(data) {
  const slug = data.slug ?? slugify(data.nombre);
  const existente = await buscarCategoriaPorSlugRepositorio(slug);
  if (existente) throw new AppError('Ya existe una categoría con ese slug', 409, 'CONFLICT');

  const categoria = await crearCategoriaRepositorio({
    nombre: data.nombre,
    slug,
    orden: data.orden ?? 0,
    activo: data.activo ?? true,
  });
  return mapearCategoriaAdmin(categoria);
}

export async function actualizarCategoriaServicio(id, data) {
  await asegurarCategoriaExiste(id);

  if (data.slug) {
    const existente = await buscarCategoriaPorSlugRepositorio(data.slug);
    if (existente && existente.id !== id) {
      throw new AppError('Ya existe una categoría con ese slug', 409, 'CONFLICT');
    }
  }

  const categoria = await actualizarCategoriaRepositorio(id, data);
  return mapearCategoriaAdmin(categoria);
}

export async function eliminarCategoriaServicio(id) {
  await asegurarCategoriaExiste(id);
  const categoria = await bajaLogicaCategoriaRepositorio(id);
  return mapearCategoriaAdmin(categoria);
}
