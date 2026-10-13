import { BRANDING_INICIAL } from './data/branding-inicial.js';

export async function seedBranding(prisma) {
  console.log('🌱 Sembrando configuración de branding...');

  await prisma.configuracionBranding.upsert({
    where: { id: BRANDING_INICIAL.id },
    update: { ...BRANDING_INICIAL },
    create: { ...BRANDING_INICIAL },
  });

  console.log('✅ Branding cargado.');
}
