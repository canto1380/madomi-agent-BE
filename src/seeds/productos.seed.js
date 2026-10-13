import { CATALOGO } from './data/catalogo.js';

export async function seedProductos(prisma) {
  console.log('🌱 Sembrando catálogo de productos...');

  for (const producto of CATALOGO) {
    await prisma.productos.upsert({
      where: { id: producto.id },
      update: {
        nombre: producto.nombre,
        categoria: producto.categoria,
        descripcion: producto.descripcion,
        orden: producto.orden,
        activo: true,
      },
      create: {
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        descripcion: producto.descripcion,
        orden: producto.orden,
        activo: true,
      },
    });
  }

  console.log(`✅ ${CATALOGO.length} productos cargados.`);
}
