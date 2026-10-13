import { DESTACADOS_INICIAL } from './data/destacados-inicial.js';

export async function seedDestacados(prisma) {
  console.log('🌱 Sembrando productos destacados...');

  for (const item of DESTACADOS_INICIAL) {
    await prisma.productosDestacados.upsert({
      where: {
        productoId_seccion: {
          productoId: item.productoId,
          seccion: item.seccion,
        },
      },
      update: { orden: item.orden, activo: true },
      create: {
        productoId: item.productoId,
        seccion: item.seccion,
        orden: item.orden,
        activo: true,
      },
    });
  }

  console.log(`✅ ${DESTACADOS_INICIAL.length} destacados cargados.`);
}
