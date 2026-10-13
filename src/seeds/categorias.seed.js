import { CATALOGO } from './data/catalogo.js';
import { CATEGORIA_ORDEN } from './data/categorias-orden.js';
import { slugify } from '../utils/slugify.js';

function ordenCategoria(nombre) {
  const index = CATEGORIA_ORDEN.indexOf(nombre);
  return index === -1 ? 999 : index + 1;
}

export async function seedCategorias(prisma) {
  console.log('🌱 Sembrando categorías...');

  const nombresUnicos = [...new Set(CATALOGO.map((p) => p.categoria))];

  for (const nombre of nombresUnicos) {
    const slug = slugify(nombre);
    await prisma.categorias.upsert({
      where: { slug },
      update: { nombre, orden: ordenCategoria(nombre), activo: true },
      create: { nombre, slug, orden: ordenCategoria(nombre), activo: true },
    });
  }

  console.log(`✅ ${nombresUnicos.length} categorías cargadas.`);
}
