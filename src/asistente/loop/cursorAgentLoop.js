import { ejecutarOrchestradorAsistente } from './orchestradorLoop.js';

/**
 * Runtime "cursor" = mismo orquestador (tools + estado) con redacción vía
 * `ASISTENTE_REDACT=cursor|auto` o legacy `CURSOR_SDK_REDACT=true`.
 *
 * No duplica Agent.prompt: la redacción vive en `redactarAsistenteConLlm.js`.
 */
export async function ejecutarCursorAgentAsistente(params) {
  const {
    respuesta,
    toolCallsCount,
    presupuestoId,
    pedidoId,
    contextoChat,
  } = await ejecutarOrchestradorAsistente(params);

  return {
    respuesta,
    toolCallsCount,
    presupuestoId: presupuestoId ?? null,
    pedidoId: pedidoId ?? null,
    cursorAgentId: params.ctx?.cursorAgentId ?? null,
    contextoChat,
  };
}
