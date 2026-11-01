/**
 * Preflight antes de deploy / después de configurar secrets en prod.
 * Exit 0 = OK para encender chat; 1 = bloqueantes.
 */
import { cargarEnvEvalChat } from './eval-chat/setupEvalEnv.js';

cargarEnvEvalChat();

const { env } = await import('../src/config/env.js');
const { isStorageConfigured } = await import('../src/services/storage.service.js');

const bloqueantes = [];
const avisos = [];

if (!env.FEATURE_ASISTENTE) {
  avisos.push('FEATURE_ASISTENTE=false (chat off — OK si no usás asistente)');
}

if (env.FEATURE_ASISTENTE) {
  if (!env.MONGODB_URI) {
    bloqueantes.push('MONGODB_URI vacío');
  }
  if (env.ASISTENTE_RUNTIME === 'orchestrador') {
    avisos.push('ASISTENTE_RUNTIME=orchestrador deprecado en prod');
  }
  const tieneLlm = env.CURSOR_API_KEY || env.OPENAI_API_KEY;
  if (!tieneLlm) {
    bloqueantes.push('Falta CURSOR_API_KEY (recomendado) u OPENAI_API_KEY');
  }
  if (env.CURSOR_API_KEY && env.CURSOR_AGENT_TARGET !== 'cloud') {
    avisos.push('CURSOR_AGENT_TARGET debería ser cloud');
  }
  if (!isStorageConfigured()) {
    avisos.push(
      env.STORAGE_DRIVER === 'local'
        ? 'Storage local sin STORAGE_PUBLIC_BASE_URL — PDF presupuesto no se sube'
        : 'Supabase sin configurar — PDF presupuesto no se sube',
    );
  }
  if (!env.CORS_ORIGIN || env.CORS_ORIGIN.includes('localhost')) {
    avisos.push(`CORS_ORIGIN=${env.CORS_ORIGIN} — en prod apuntá al dominio del frontend`);
  }
}

console.log('=== Check producción asistente ===\n');
console.log(`NODE_ENV=${env.NODE_ENV}`);
console.log(`Runtime=${env.ASISTENTE_RUNTIME} LLM=${env.ASISTENTE_LLM_PROVEEDOR}\n`);

for (const a of avisos) {
  console.log('⚠️ ', a);
}
for (const b of bloqueantes) {
  console.log('❌', b);
}

if (bloqueantes.length) {
  console.log('\nResultado: NO listo para chat en prod.');
  process.exit(1);
}

console.log('\nResultado: variables mínimas OK. Corré seed mongo, activá bot y npm run test:eval:chat:smoke.');
process.exit(0);
