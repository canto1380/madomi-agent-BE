import { prisma } from '../providers/prisma.js';

export async function listarContenidoActivoRepositorio() {
  return prisma.contenidoTextos.findMany({
    where: { activo: true },
    orderBy: [{ seccion: 'asc' }, { orden: 'asc' }, { clave: 'asc' }],
  });
}

export async function listarContenidoPorSeccionRepositorio(seccion) {
  return prisma.contenidoTextos.findMany({
    where: { seccion, activo: true },
    orderBy: [{ orden: 'asc' }, { clave: 'asc' }],
  });
}

export async function listarContenidoAdminRepositorio({ search, activo, seccion, sort, order }) {
  const where = {};
  if (activo !== undefined) where.activo = activo;
  if (seccion) where.seccion = seccion;
  if (search) {
    where.OR = [
      { clave: { contains: search, mode: 'insensitive' } },
      { valor: { contains: search, mode: 'insensitive' } },
      { seccion: { contains: search, mode: 'insensitive' } },
    ];
  }
  const orderBy = sort
    ? { [sort]: order === 'desc' ? 'desc' : 'asc' }
    : [{ seccion: 'asc' }, { orden: 'asc' }, { clave: 'asc' }];
  return prisma.contenidoTextos.findMany({ where, orderBy });
}

export async function buscarContenidoPorIdRepositorio(id) {
  return prisma.contenidoTextos.findUnique({ where: { id } });
}

export async function buscarContenidoPorClaveRepositorio(clave) {
  return prisma.contenidoTextos.findUnique({ where: { clave } });
}

export async function crearContenidoRepositorio(data) {
  return prisma.contenidoTextos.create({ data });
}

export async function actualizarContenidoRepositorio(id, data) {
  return prisma.contenidoTextos.update({ where: { id }, data });
}

export async function bajaLogicaContenidoRepositorio(id) {
  return prisma.contenidoTextos.update({ where: { id }, data: { activo: false } });
}

export async function contarContenidoRepositorio() {
  return prisma.contenidoTextos.count();
}

export async function contarContenidoInactivoRepositorio() {
  return prisma.contenidoTextos.count({ where: { activo: false } });
}
