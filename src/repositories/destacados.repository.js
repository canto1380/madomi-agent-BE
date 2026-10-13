import { prisma } from '../providers/prisma.js';

export async function listarDestacadosActivosRepositorio(seccion = 'lo_ultimo') {
  return prisma.productosDestacados.findMany({
    where: { seccion, activo: true, producto: { activo: true } },
    include: { producto: true },
    orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listarDestacadosAdminRepositorio({ search, activo, seccion, sort, order }) {
  const where = {};
  if (activo !== undefined) where.activo = activo;
  if (seccion) where.seccion = seccion;
  if (search) {
    where.OR = [
      { productoId: { contains: search, mode: 'insensitive' } },
      { seccion: { contains: search, mode: 'insensitive' } },
      { producto: { nombre: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const orderBy = sort
    ? { [sort]: order === 'desc' ? 'desc' : 'asc' }
    : [{ seccion: 'asc' }, { orden: 'asc' }];
  return prisma.productosDestacados.findMany({ where, include: { producto: true }, orderBy });
}

export async function buscarDestacadoPorIdRepositorio(id) {
  return prisma.productosDestacados.findUnique({ where: { id }, include: { producto: true } });
}

export async function buscarDestacadoPorProductoSeccionRepositorio(productoId, seccion) {
  return prisma.productosDestacados.findUnique({
    where: { productoId_seccion: { productoId, seccion } },
  });
}

export async function crearDestacadoRepositorio(data) {
  return prisma.productosDestacados.create({ data, include: { producto: true } });
}

export async function actualizarDestacadoRepositorio(id, data) {
  return prisma.productosDestacados.update({ where: { id }, data, include: { producto: true } });
}

export async function bajaLogicaDestacadoRepositorio(id) {
  return prisma.productosDestacados.update({
    where: { id },
    data: { activo: false },
    include: { producto: true },
  });
}

export async function contarDestacadosRepositorio() {
  return prisma.productosDestacados.count();
}
