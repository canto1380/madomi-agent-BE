import { seedProductos } from './productos.seed.js';
import { seedCategorias } from './categorias.seed.js';
import { seedContenido } from './contenido.seed.js';
import { seedBranding } from './branding.seed.js';
import { seedContacto } from './contacto.seed.js';
import { seedDestacados } from './destacados.seed.js';
import { seedMedia } from './media.seed.js';
import { seedRedes } from './redes.seed.js';
import { seedUsuariosModulo } from './usuarios.seed.js';

export async function ejecutarSeedsCMS(prisma) {
  await seedProductos(prisma);
  await seedCategorias(prisma);
  await seedContenido(prisma);
  await seedBranding(prisma);
  await seedContacto(prisma);
  await seedDestacados(prisma);
  await seedMedia(prisma);
  await seedRedes(prisma);
}

export async function ejecutarSeeds(prisma) {
  await ejecutarSeedsCMS(prisma);
  await seedUsuariosModulo(prisma);
}
