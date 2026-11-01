import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import { ejecutarOrchestradorAsistente } from './orchestradorLoop.js';
import { ejecutarAgenteClientesIa } from '../agentes/agenteClientesIa/run.js';

/**
 * Punto único del runtime del chat (sin LangChain).
 * Default Madomi: agente-clientes-ia (LLM + tools + commerce kernel).
 */
export async function ejecutarLoopAsistente(params) {
  const baseParams = { ...params, contextoChat: params.contextoChat };
  const runtime = env.ASISTENTE_RUNTIME;

  switch (runtime) {
    case 'agente-clientes-ia':
    case 'agente-clientes':
    case 'openai':
    case 'cursor':
      return ejecutarAgenteClientesIa(baseParams);
    case 'orchestrador':
      if (env.NODE_ENV === 'production') {
        console.warn(
          '[asistente] ASISTENTE_RUNTIME=orchestrador en producción está deprecado; usar agente-clientes-ia',
        );
      }
      return ejecutarOrchestradorAsistente(baseParams);
    default:
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
}
