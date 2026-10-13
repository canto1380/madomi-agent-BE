import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });
process.env.ASISTENTE_REDACT = 'none';

const { initializeDatabase } = await import('../src/startup/database.js');
const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
await initializeDatabase();
await connectMongo();

const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');

const sid = randomUUID();
const pasos = [
  'productos nuevos',
  '10 unidades de bondiola y 15 de guiso de lenteja',
  'Alejandro penalba 3815479768',
  'Soy de San Miguel de Tucuman',
];

for (const mensaje of pasos) {
  console.log('\n--- USER:', mensaje);
  const data = await enviarMensajeChatServicio({
    sessionAnonimaId: sid,
    mensaje,
    metadata: { canal: 'test' },
  });
  console.log('presupuestoId:', data.presupuestoId);
  console.log('respuesta:', data.respuesta?.slice(0, 350));
}

await disconnectMongo();
