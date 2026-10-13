import { CONTENIDO_INICIAL } from './data/contenido-inicial.js';

export async function seedContenido(prisma) {
  console.log('🌱 Sembrando textos del sitio...');

  for (const item of CONTENIDO_INICIAL) {
    await prisma.contenidoTextos.upsert({
      where: { clave: item.clave },
      update: {
        valor: item.valor,
        seccion: item.seccion,
        tipo: item.tipo ?? 'texto',
        orden: item.orden ?? 0,
        activo: true,
      },
      create: {
        clave: item.clave,
        valor: item.valor,
        seccion: item.seccion,
        tipo: item.tipo ?? 'texto',
        orden: item.orden ?? 0,
        activo: true,
      },
    });
  }

  console.log(`✅ ${CONTENIDO_INICIAL.length} textos cargados.`);
}
