import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function cargarEnvEvalChat() {
  dotenv.config({ path: path.join(backendRoot, '.env') });
  process.env.ASISTENTE_RUNTIME = process.env.ASISTENTE_RUNTIME || 'agente-clientes-ia';
  process.env.ASISTENTE_LLM_PROVEEDOR = process.env.ASISTENTE_LLM_PROVEEDOR || 'auto';
  process.env.ASISTENTE_REDACT = 'none';
}

export async function bootstrapEvalChat() {
  cargarEnvEvalChat();
  const { initializeDatabase } = await import('../../src/startup/database.js');
  const { connectMongo } = await import('../../src/mongo/connection.js');
  await import('../../src/mongo/models/index.js');
  const { env } = await import('../../src/config/env.js');

  if (!env.FEATURE_ASISTENTE) {
    throw new Error('FEATURE_ASISTENTE debe ser true en .env');
  }

  await initializeDatabase();
  await connectMongo();

  const { enviarMensajeChatServicio } = await import('../../src/services/chat.service.js');
  return { env, enviarMensajeChatServicio };
}

export async function teardownEvalChat() {
  const { disconnectMongo } = await import('../../src/mongo/connection.js');
  await disconnectMongo();
}
