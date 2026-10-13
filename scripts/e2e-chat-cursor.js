/**
 * E2E chat Madomi: Mongo + Postgres + 2 turnos POST /api/chat (runtime cursor = orquestador).
 *
 * Por defecto NO invoca Cursor SDK local (evita cuelgues SQLite/CLI).
 * Para probar redacción cloud: E2E_USE_CURSOR_SDK=true npm run test:e2e:chat-cursor
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

process.env.ASISTENTE_RUNTIME = process.env.ASISTENTE_RUNTIME || 'cursor';

if (process.env.E2E_USE_CURSOR_SDK !== 'true') {
  process.env.CURSOR_SDK_REDACT = 'false';
  process.env.ASISTENTE_REDACT = 'none';
  process.env.CURSOR_AGENT_TARGET = 'cloud';
} else {
  process.env.CURSOR_SDK_REDACT = 'true';
  process.env.ASISTENTE_REDACT = 'cursor';
  process.env.CURSOR_AGENT_TARGET = 'cloud';
}

const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
const { initializeDatabase } = await import('../src/startup/database.js');
const { prisma } = await import('../src/providers/prisma.js');
const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');
const { env } = await import('../src/config/env.js');

function assert(condicion, mensaje) {
  if (!condicion) {
    throw new Error(mensaje);
  }
}

async function main() {
  console.log('=== E2E chat (runtime cursor / orquestador Madomi) ===\n');
  console.log('Runtime:', env.ASISTENTE_RUNTIME);
  console.log('SDK redacción Cursor:', env.CURSOR_SDK_REDACT ? 'sí (cloud)' : 'no (solo orquestador)');
  console.log('Node:', process.version, '\n');

  if (!env.FEATURE_ASISTENTE) {
    throw new Error('FEATURE_ASISTENTE debe ser true');
  }
  if (env.ASISTENTE_RUNTIME !== 'cursor' && env.ASISTENTE_RUNTIME !== 'orchestrador') {
    throw new Error('ASISTENTE_RUNTIME debe ser cursor u orchestrador');
  }
  if (env.CURSOR_SDK_REDACT && !env.CURSOR_API_KEY) {
    throw new Error('CURSOR_API_KEY requerida cuando CURSOR_SDK_REDACT=true');
  }

  await initializeDatabase();
  await connectMongo();

  const sessionAnonimaId = randomUUID();
  console.log('Session:', sessionAnonimaId, '\n');

  console.log('--- Turno 1: saludo ---');
  const t1 = await enviarMensajeChatServicio({
    sessionAnonimaId,
    mensaje: 'Hola, ¿qué productos de ravioles tienen?',
    metadata: { canal: 'web_chat' },
  });
  console.log('estadoLead:', t1.estadoLead);
  console.log('respuesta:', `${t1.respuesta.slice(0, 500)}...\n`);
  assert(t1.conversacionId, 'conversacionId vacío');
  assert(t1.leadId, 'leadId vacío');
  assert(t1.respuesta?.length > 10, 'respuesta vacía turno 1');
  assert(/ravioles/i.test(t1.respuesta), 'turno 1 debe listar ravioles');
  assert(!/no encontr[eé] productos/i.test(t1.respuesta), 'turno 1 no debe fallar búsqueda ravioles');

  console.log('--- Turno 2: envíos (misma sesión) ---');
  const t2 = await enviarMensajeChatServicio({
    sessionAnonimaId,
    mensaje: '¿Entregan a Yerba Buena y en cuántos días?',
    metadata: { canal: 'web_chat' },
  });
  console.log('estadoLead:', t2.estadoLead);
  console.log('respuesta:', `${t2.respuesta.slice(0, 500)}...\n`);
  assert(t2.conversacionId === t1.conversacionId, 'debe reutilizar conversación');
  assert(t2.respuesta?.length > 10, 'respuesta vacía turno 2');

  console.log('✅ E2E chat completado.');
}

main()
  .catch((err) => {
    console.error('\n❌ E2E falló:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
    await prisma.$disconnect();
  });
