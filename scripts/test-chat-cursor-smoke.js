import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });
process.env.ASISTENTE_RUNTIME = 'agente-clientes-ia';
process.env.ASISTENTE_REDACT = 'none';

const { initializeDatabase } = await import('../src/startup/database.js');
const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
await initializeDatabase();
await connectMongo();

const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');
const data = await enviarMensajeChatServicio({
  sessionAnonimaId: randomUUID(),
  mensaje: 'hola',
  metadata: { canal: 'test' },
});
console.log('respuesta:', data.respuesta?.slice(0, 300));

await disconnectMongo();
