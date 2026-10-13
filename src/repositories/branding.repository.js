import { prisma } from '../providers/prisma.js';

const BRANDING_ID = 'default';

export async function obtenerBrandingRepositorio() {
  return prisma.configuracionBranding.findUnique({ where: { id: BRANDING_ID } });
}

export async function obtenerBrandingActivoRepositorio() {
  return prisma.configuracionBranding.findFirst({ where: { id: BRANDING_ID, activo: true } });
}

export async function actualizarBrandingRepositorio(data) {
  return prisma.configuracionBranding.update({ where: { id: BRANDING_ID }, data });
}
