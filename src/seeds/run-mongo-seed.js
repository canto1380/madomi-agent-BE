import { connectMongo, disconnectMongo, isMongoHabilitado } from '../mongo/connection.js';
import '../mongo/models/index.js';
import { seedAsistenteMongo } from './asistente-mongo.seed.js';

async function main() {
  if (!isMongoHabilitado()) {
    console.error(
      'FEATURE_ASISTENTE no está activo. Definí FEATURE_ASISTENTE=true y MONGODB_URI en backend/.env',
    );
    process.exit(1);
  }

  await connectMongo();
  await seedAsistenteMongo();
  await disconnectMongo();
  console.log('[seed:mongo] Finalizado.');
}

main().catch((error) => {
  console.error('[seed:mongo] Error:', error);
  process.exit(1);
});
