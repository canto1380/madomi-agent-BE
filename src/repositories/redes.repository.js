import { prisma } from '../providers/prisma.js';

export async function listarRedesActivasRepositorio() {
  return prisma.redesSociales.findMany({
    where: { activo: true },
    orderBy: [{ orden: 'asc' }, { plataforma: 'asc' }],
  });
}

export async function listarRedesAdminRepositorio({ search, activo, sort, order }) {
  const where = {};
  if (activo !== undefined) where.activo = activo;
  if (search) {
    where.OR = [
      { plataforma: { contains: search, mode: 'insensitive' } },
      { url: { contains: search, mode: 'insensitive' } },
    ];
  }
  const orderBy = sort
    ? { [sort]: order === 'desc' ? 'desc' : 'asc' }
    : [{ orden: 'asc' }, { plataforma: 'asc' }];
  return prisma.redesSociales.findMany({ where, orderBy });
}

export async function buscarRedPorIdRepositorio(id) {
  return prisma.redesSociales.findUnique({ where: { id } });
}

export async function crearRedRepositorio(data) {
  return prisma.redesSociales.create({ data });
}

export async function actualizarRedRepositorio(id, data) {
  return prisma.redesSociales.update({ where: { id }, data });
}

export async function bajaLogicaRedRepositorio(id) {
  return prisma.redesSociales.update({ where: { id }, data: { activo: false } });
}

export async function contarRedesRepositorio() {
  return prisma.redesSociales.count();
}

export async function contarRedesInactivasRepositorio() {
  return prisma.redesSociales.count({ where: { activo: false } });
}
