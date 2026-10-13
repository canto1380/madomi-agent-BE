import { prisma } from '../providers/prisma.js';

export async function listarMediaActivosRepositorio() {
  return prisma.mediaAssets.findMany({
    where: { activo: true },
    orderBy: [{ orden: 'asc' }, { clave: 'asc' }],
  });
}

export async function listarMediaAdminRepositorio({ search, activo, tipo, sort, order }) {
  const where = {};
  if (activo !== undefined) where.activo = activo;
  if (tipo) where.tipo = tipo;
  if (search) {
    where.OR = [
      { clave: { contains: search, mode: 'insensitive' } },
      { url: { contains: search, mode: 'insensitive' } },
      { alt: { contains: search, mode: 'insensitive' } },
    ];
  }
  const orderBy = sort ? { [sort]: order === 'desc' ? 'desc' : 'asc' } : [{ orden: 'asc' }, { clave: 'asc' }];
  return prisma.mediaAssets.findMany({ where, orderBy });
}

export async function buscarMediaPorIdRepositorio(id) {
  return prisma.mediaAssets.findUnique({ where: { id } });
}

export async function buscarMediaPorClaveRepositorio(clave) {
  return prisma.mediaAssets.findUnique({ where: { clave } });
}

export async function crearMediaRepositorio(data) {
  return prisma.mediaAssets.create({ data });
}

export async function actualizarMediaRepositorio(id, data) {
  return prisma.mediaAssets.update({ where: { id }, data });
}

export async function bajaLogicaMediaRepositorio(id) {
  return prisma.mediaAssets.update({ where: { id }, data: { activo: false } });
}

export async function contarMediaRepositorio() {
  return prisma.mediaAssets.count();
}

export async function contarMediaInactivosRepositorio() {
  return prisma.mediaAssets.count({ where: { activo: false } });
}
