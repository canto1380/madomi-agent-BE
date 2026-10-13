import { env } from '../../config/env.js';

/**
 * Proveedor de redacción final (prompt maestro + historial + hechos de tools).
 * auto: OpenAI si hay key, si no Cursor si hay key.
 */
export function resolverModoRedaccion({ runtime = env.ASISTENTE_RUNTIME } = {}) {
  const raw = (env.ASISTENTE_REDACT?.trim() || '').toLowerCase();

  if (raw === 'none' || raw === 'off' || raw === 'false') {
    return null;
  }

  if (raw === 'openai') {
    return env.OPENAI_API_KEY ? 'openai' : null;
  }

  if (raw === 'cursor') {
    return env.CURSOR_API_KEY && env.CURSOR_AGENT_TARGET === 'cloud' ? 'cursor' : null;
  }

  if (raw === 'auto') {
    if (runtime === 'cursor' && env.CURSOR_API_KEY && env.CURSOR_AGENT_TARGET === 'cloud') {
      return 'cursor';
    }
    if (env.OPENAI_API_KEY) {
      return 'openai';
    }
    if (env.CURSOR_API_KEY && env.CURSOR_AGENT_TARGET === 'cloud') {
      return 'cursor';
    }
  }

  // Compat: pulido OpenAI explícito
  if (env.ASISTENTE_REDACT_OPENAI && env.OPENAI_API_KEY) {
    return 'openai';
  }

  // Compat: runtime cursor con SDK redact
  if (
    runtime === 'cursor' &&
    env.CURSOR_SDK_REDACT &&
    env.CURSOR_API_KEY &&
    env.CURSOR_AGENT_TARGET === 'cloud'
  ) {
    return 'cursor';
  }

  return null;
}
