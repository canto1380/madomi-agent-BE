import { env } from '../../../config/env.js';

/**
 * Proveedor del loop conversacional del agente-clientes-ia.
 * Default: Cursor (Composer cloud). OpenAI solo si se fuerza explícitamente.
 */
export function resolverProveedorLlmAgenteClientes() {
  const explicit = env.ASISTENTE_LLM_PROVEEDOR?.trim().toLowerCase();
  if (explicit === 'openai') {
    return env.OPENAI_API_KEY ? 'openai' : null;
  }
  if (explicit === 'cursor') {
    return env.CURSOR_API_KEY ? 'cursor' : null;
  }
  if (env.CURSOR_API_KEY && env.CURSOR_AGENT_TARGET === 'cloud') {
    return 'cursor';
  }
  if (env.OPENAI_API_KEY) {
    return 'openai';
  }
  return env.CURSOR_API_KEY ? 'cursor' : null;
}
