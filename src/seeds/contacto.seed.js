import { CONTACTO_INICIAL } from './data/contacto-inicial.js';

export async function seedContacto(prisma) {
  console.log('🌱 Sembrando configuración de contacto...');

  await prisma.configuracionContacto.upsert({
    where: { id: CONTACTO_INICIAL.id },
    update: { ...CONTACTO_INICIAL },
    create: { ...CONTACTO_INICIAL },
  });

  console.log('✅ Contacto cargado.');
}
