import { env } from '../config/env.js';
import { isStorageConfigured } from '../services/storage.service.js';

const RUNTIMES_AGENTE = new Set(['agente-clientes-ia', 'agente-clientes', 'openai', 'cursor']);

function llmConfigurado() {
  const prov = env.ASISTENTE_LLM_PROVEEDOR;
  if (prov === 'cursor') {
    return Boolean(env.CURSOR_API_KEY);
  }
  if (prov === 'openai') {
    return Boolean(env.OPENAI_API_KEY);
  }
  return Boolean(env.CURSOR_API_KEY || env.OPENAI_API_KEY);
}

/**
 * Avisos/errores al boot en NODE_ENV=production.
 */
export function validarAsistenteProduccion() {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (!env.FEATURE_ASISTENTE) {
    console.warn('⚠️  [prod] FEATURE_ASISTENTE=false — el chat público quedará deshabilitado.');
    return;
  }

  if (env.ASISTENTE_RUNTIME === 'orchestrador') {
    console.error(
      '❌ [prod] ASISTENTE_RUNTIME=orchestrador está deprecado. Usá agente-clientes-ia.',
    );
  }

  if (RUNTIMES_AGENTE.has(env.ASISTENTE_RUNTIME) && !llmConfigurado()) {
    throw new Error(
      '[prod] Chat activo pero falta CURSOR_API_KEY (recomendado) u OPENAI_API_KEY para agente-clientes-ia.',
    );
  }

  if (env.CURSOR_AGENT_TARGET !== 'cloud' && RUNTIMES_AGENTE.has(env.ASISTENTE_RUNTIME)) {
    console.warn('⚠️  [prod] CURSOR_AGENT_TARGET debería ser cloud para POST /api/chat.');
  }

  if (env.ASISTENTE_REDACT && env.ASISTENTE_REDACT !== 'none') {
    console.warn(
      '⚠️  [prod] ASISTENTE_REDACT≠none no aplica a agente-clientes-ia; podés usar ASISTENTE_REDACT=none.',
    );
  }

  if (!isStorageConfigured()) {
    const detalle =
      env.STORAGE_DRIVER === 'local'
        ? 'definí STORAGE_PUBLIC_BASE_URL (y, si hace falta, STORAGE_LOCAL_DIR)'
        : 'definí SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, o usá STORAGE_DRIVER=local';
    console.warn(`⚠️  [prod] Storage no configurado — generarPresupuestoPdf no podrá guardar PDF. ${detalle}.`);
  }

  console.log(
    `🤖 [prod] Asistente: runtime=${env.ASISTENTE_RUNTIME} llm=${env.ASISTENTE_LLM_PROVEEDOR} slug=${env.ASISTENTE_EMPRESA_SLUG}`,
  );
}
