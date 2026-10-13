import { MEDIA_INICIAL } from './data/media-inicial.js';

export async function seedMedia(prisma) {
  console.log('🌱 Sembrando media assets...');

  for (const item of MEDIA_INICIAL) {
    await prisma.mediaAssets.upsert({
      where: { clave: item.clave },
      update: {
        tipo: item.tipo,
        url: item.url,
        alt: item.alt ?? null,
        orden: item.orden ?? 0,
        activo: true,
      },
      create: {
        clave: item.clave,
        tipo: item.tipo,
        url: item.url,
        alt: item.alt ?? null,
        orden: item.orden ?? 0,
        activo: true,
      },
    });
  }

  console.log(`✅ ${MEDIA_INICIAL.length} assets cargados.`);
}
