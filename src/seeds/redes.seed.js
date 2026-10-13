export async function seedRedes(prisma) {
  console.log('🌱 Redes sociales: sin datos iniciales (admin puede crear).');
  await prisma.redesSociales.count();
}
