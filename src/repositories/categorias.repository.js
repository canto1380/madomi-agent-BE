import { prisma } from '../providers/prisma.js';

export async function listarCategoriasActivasRepositorio() {
  return prisma.categorias.findMany({
    where: { activo: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  });
}

export async function listarCategoriasAdminRepositorio({ search, activo, sort, order }) {
  const where = {};
  if (activo !== undefined) where.activo = activo;
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }
  const orderBy = sort ? { [sort]: order === 'desc' ? 'desc' : 'asc' } : [{ orden: 'asc' }, { nombre: 'asc' }];
  return prisma.categorias.findMany({ where, orderBy });
}

export async function buscarCategoriaPorIdRepositorio(id) {
  return prisma.categorias.findUnique({ where: { id } });
}

export async function buscarCategoriaPorSlugRepositorio(slug) {
  return prisma.categorias.findUnique({ where: { slug } });
}

export async function crearCategoriaRepositorio(data) {
  return prisma.categorias.create({ data });
}

export async function actualizarCategoriaRepositorio(id, data) {
  return prisma.categorias.update({ where: { id }, data });
}

export async function bajaLogicaCategoriaRepositorio(id) {
  return prisma.categorias.update({ where: { id }, data: { activo: false } });
}

export async function contarCategoriasRepositorio() {
  return prisma.categorias.count();
}

export async function contarCategoriasInactivasRepositorio() {
  return prisma.categorias.count({ where: { activo: false } });
}
