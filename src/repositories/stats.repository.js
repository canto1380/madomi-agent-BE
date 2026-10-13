import { prisma } from '../providers/prisma.js';

export async function obtenerConteosCMSRepositorio() {
  const [
    productos,
    productosInactivos,
    categorias,
    categoriasInactivas,
    textos,
    textosInactivos,
    media,
    mediaInactivos,
    redes,
    redesInactivas,
    destacados,
  ] = await Promise.all([
    prisma.productos.count(),
    prisma.productos.count({ where: { activo: false } }),
    prisma.categorias.count(),
    prisma.categorias.count({ where: { activo: false } }),
    prisma.contenidoTextos.count(),
    prisma.contenidoTextos.count({ where: { activo: false } }),
    prisma.mediaAssets.count(),
    prisma.mediaAssets.count({ where: { activo: false } }),
    prisma.redesSociales.count(),
    prisma.redesSociales.count({ where: { activo: false } }),
    prisma.productosDestacados.count({ where: { activo: true } }),
  ]);

  return {
    productos,
    productosInactivos,
    categorias,
    categoriasInactivas,
    textos,
    textosInactivos,
    media,
    mediaInactivos,
    redes,
    redesInactivas,
    destacados,
  };
}
