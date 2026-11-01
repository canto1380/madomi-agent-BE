import { env } from '../../../config/env.js';
import { withTimeout } from '../../loop/cursorRunTimeout.js';
import { extraerTextoRunResult } from '../../loop/cursorSdkText.js';
import { serializarToolsParaPrompt } from './serializarToolsParaPrompt.js';

function formatearHistorial(historialMensajes, max = env.CHAT_HISTORIAL_MAX_MENSAJES) {
  return historialMensajes
    .filter((m) => m.rol === 'user' || m.rol === 'assistant')
    .slice(-max)
    .map((m) => `${m.rol === 'user' ? 'Cliente' : 'Asistente'}: ${m.contenido}`)
    .join('\n');
}

function formatearResultadosToolsTurno(resultadosTools) {
  if (!resultadosTools.length) {
    return '(ninguna tool ejecutada aún en este turno)';
  }
  return resultadosTools
    .map((r) => `Tool ${r.tool}:\n${JSON.stringify(r.result, null, 2).slice(0, 4000)}`)
    .join('\n\n');
}

const INSTRUCCION_JSON = `
## Formato de salida (OBLIGATORIO)

Respondé con un único objeto JSON (sin texto fuera del JSON):

Para ejecutar una o más tools:
{"accion":"tools","llamadas":[{"nombre":"<tool>","args":{...}}]}

Para responder al cliente (solo cuando ya tengas datos verificados o no hace falta tool):
{"accion":"responder","texto":"..."}

Reglas:
- Si necesitás precio/stock/catálogo/presupuesto/lead, usá tools antes de responder.
- Podés encadenar varias tools en un mismo JSON con varias entradas en "llamadas".
- No inventes precios: si no llamaste consultarPrecio/calcularPresupuesto, no cites montos.
- En "texto" usá prosa plana para chat: sin markdown (nada de **, __, ## ni bloques \`\`\`).
`;

export async function cursorPromptTurnoAgente({
  systemPrompt,
  tools,
  historialMensajes,
  mensajeUsuario,
  resultadosToolsTurno,
  reintentoJson = false,
}) {
  const catalogo = serializarToolsParaPrompt(tools);
  const historial = formatearHistorial(historialMensajes);
  const hechosTurno = formatearResultadosToolsTurno(resultadosToolsTurno);

  const prompt = `${systemPrompt}

---

## Tools disponibles (ejecutá en el backend con "accion":"tools")
${catalogo}

${INSTRUCCION_JSON}
${reintentoJson ? '\nIMPORTANTE: tu mensaje anterior no fue JSON válido. Respondé SOLO el objeto JSON.\n' : ''}

---

## Historial de la conversación
${historial || '(sin historial)'}

## Resultados de tools en este turno (ya ejecutadas)
${hechosTurno}

## Último mensaje del cliente
${mensajeUsuario}
`;

  const modelId = env.CURSOR_MODEL || 'composer-2.5';
  const { Agent } = await import('@cursor/sdk');

  const runResult = await withTimeout(
    Agent.prompt(prompt, {
      apiKey: env.CURSOR_API_KEY,
      model: { id: modelId },
      cloud: {
        metadata: {
          app: 'madomi-chat',
          env: env.NODE_ENV,
          mode: 'agente-clientes-ia',
        },
      },
    }),
    env.CURSOR_RUN_TIMEOUT_MS,
    'CURSOR_AGENTE_CLIENTES_TIMEOUT',
  );

  if (runResult.status === 'error') {
    throw new Error(runResult.error?.message ?? 'cursor_run_error');
  }

  const bruto = runResult.result;
  const texto =
    (typeof bruto === 'string' ? bruto : bruto?.text)?.trim() ||
    extraerTextoRunResult(runResult)?.trim() ||
    '';

  return { texto, modelId };
}
