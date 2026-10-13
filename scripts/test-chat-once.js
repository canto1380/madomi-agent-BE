import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const mensaje = process.argv[2] ?? 'hola. para consultar precios';
process.env.ASISTENTE_REDACT = process.env.ASISTENTE_REDACT ?? 'auto';

const { initializeDatabase } = await import('../src/startup/database.js');
const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');

await initializeDatabase();
await connectMongo();

const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');

try {
  const sessionAnonimaId = randomUUID();
  const data = await enviarMensajeChatServicio({
    sessionAnonimaId,
    mensaje,
    metadata: { canal: 'test' },
  });
  console.log('OK:', data.respuesta);
} catch (e) {
  console.error('FAIL:', e.message);
  console.error(e.stack);
}

await disconnectMongo();
