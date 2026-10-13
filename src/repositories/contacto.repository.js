import { prisma } from '../providers/prisma.js';

const CONTACTO_ID = 'default';

export async function obtenerContactoRepositorio() {
  return prisma.configuracionContacto.findUnique({ where: { id: CONTACTO_ID } });
}

export async function obtenerContactoActivoRepositorio() {
  return prisma.configuracionContacto.findFirst({ where: { id: CONTACTO_ID, activo: true } });
}

export async function actualizarContactoRepositorio(data) {
  return prisma.configuracionContacto.update({ where: { id: CONTACTO_ID }, data });
}
