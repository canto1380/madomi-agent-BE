import { prisma } from '../providers/prisma.js';
import { rankearProductosPorSimilitud } from '../asistente/busqueda/similitudTexto.js';

const includeDestacados = {
  destacados: {
    where: { activo: true },
  },
};

export async function listarProductosActivosRepositorio() {
  return prisma.productos.findMany({
    where: { activo: true },
    include: includeDestacados,
    orderBy: [{ categoria: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }],
  });
}

export async function listarProductosAdminRepositorio({ search, activo, categoria, sort, order }) {
  const where = {};

  if (activo !== undefined) {
    where.activo = activo;
  }

  if (categoria) {
    where.categoria = { equals: categoria, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { categoria: { contains: search, mode: 'insensitive' } },
      { descripcion: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = sort
    ? { [sort]: order === 'desc' ? 'desc' : 'asc' }
    : [{ categoria: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }];

  return prisma.productos.findMany({ where, orderBy, include: { destacados: true } });
}

export async function buscarProductoPorIdRepositorio(id) {
  return prisma.productos.findUnique({
    where: { id },
    include: { destacados: true },
  });
}

export async function crearProductoRepositorio(data) {
  return prisma.productos.create({ data });
}

export async function actualizarProductoRepositorio(id, data) {
  return prisma.productos.update({ where: { id }, data });
}

export async function bajaLogicaProductoRepositorio(id) {
  return prisma.productos.update({
    where: { id },
    data: { activo: false },
  });
}

const whereComercialActivo = {
  activo: true,
  activoComercial: true,
};

export async function listarProductosComercialesRepositorio({
  search,
  categoria,
  limit = 20,
  ids,
}) {
  const where = { ...whereComercialActivo };

  if (ids?.length) {
    return prisma.productos.findMany({
      where: { ...where, id: { in: ids } },
      take: Math.min(ids.length, 50),
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  if (categoria?.trim()) {
    where.categoria = { equals: categoria.trim(), mode: 'insensitive' };
  }

  if (search?.trim()) {
    const tokens = search
      .trim()
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    const condicionToken = (token) => ({
      OR: [
        { nombre: { contains: token, mode: 'insensitive' } },
        { categoria: { contains: token, mode: 'insensitive' } },
        { descripcion: { contains: token, mode: 'insensitive' } },
        { id: { contains: token, mode: 'insensitive' } },
      ],
    });

    const condiciones = tokens.flatMap((token) => condicionToken(token).OR);
    where.OR = condiciones.length ? condiciones : condicionToken(search.trim()).OR;
  }

  const exactos = await prisma.productos.findMany({
    where,
    take: Math.min(limit, 80),
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  });

  if (search?.trim() && exactos.length > 1) {
    const reranked = rankearProductosPorSimilitud(exactos, search.trim(), {
      limit: Math.min(limit, 80),
    });
    if (reranked.length) {
      return reranked;
    }
  }

  if (exactos.length > 0 || !search?.trim()) {
    return exactos;
  }

  return buscarProductosComercialesFuzzy({
    search: search.trim(),
    categoria,
    limit,
  });
}

async function buscarProductosComercialesFuzzy({ search, categoria, limit = 20 }) {
  const where = { ...whereComercialActivo };
  if (categoria?.trim()) {
    where.categoria = { equals: categoria.trim(), mode: 'insensitive' };
  }

  const candidatos = await prisma.productos.findMany({
    where,
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  });

  const rankeados = rankearProductosPorSimilitud(candidatos, search, {
    limit: Math.min(limit, 50),
  });

  if (rankeados.length > 0) {
    return rankeados;
  }

  if (categoria) {
    return candidatos.slice(0, Math.min(limit, 50));
  }

  const todos = await prisma.productos.findMany({
    where: whereComercialActivo,
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  });

  return rankearProductosPorSimilitud(todos, search, { limit: Math.min(limit, 50) });
}

export async function obtenerProductoComercialPorIdRepositorio(id) {
  return prisma.productos.findFirst({
    where: { id, ...whereComercialActivo },
  });
}

