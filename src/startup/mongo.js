import { connectMongo, getEstadoMongo, isMongoHabilitado } from '../mongo/connection.js';
import '../mongo/models/index.js';

export async function initializeMongo() {
  if (!isMongoHabilitado()) {
    console.log('🍃 MongoDB CRM: deshabilitado (FEATURE_ASISTENTE ≠ true).');
    return;
  }

  console.log('🍃 Conectando MongoDB CRM...');
  await connectMongo();
  console.log(`✅ MongoDB CRM: ${getEstadoMongo()}.`);
}
