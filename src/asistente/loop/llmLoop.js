import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import { ejecutarOrchestradorAsistente } from './orchestradorLoop.js';
import { ejecutarCursorAgentAsistente } from './cursorAgentLoop.js';
import { ejecutarOpenAiAsistente } from './openaiLoop.js';

/**
 * Punto único del runtime del chat (sin LangChain).
 * Default Madomi: orchestrador (tools + reglas, sin OpenAI).
 */
export async function ejecutarLoopAsistente(params) {
  const baseParams = { ...params, contextoChat: params.contextoChat };

  switch (env.ASISTENTE_RUNTIME) {
    case 'openai':
      return ejecutarOpenAiAsistente(baseParams);
    case 'cursor':
      return ejecutarCursorAgentAsistente(baseParams);
    case 'orchestrador':
      return ejecutarOrchestradorAsistente(baseParams);
    default:
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
}
