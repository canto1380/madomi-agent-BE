import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import { buildSystemPromptV1 } from '../prompts/systemV1.js';
import { ejecutarTool, toOpenAiTools } from '../tools/index.js';
import { crearAgenteRunRepositorio } from '../../mongo/repositories/agenteRuns.repository.js';

const MAX_TOOL_ITERATIONS = 8;

function mapearHistorialParaLlm(mensajes, maxTurnos = env.CHAT_HISTORIAL_MAX_MENSAJES) {
  const relevantes = mensajes.filter((m) => m.rol === 'user' || m.rol === 'assistant');
  return relevantes.slice(-maxTurnos).map((m) => ({
    role: m.rol === 'user' ? 'user' : 'assistant',
    content: m.contenido,
  }));
}

/** @deprecated Usar `ejecutarAgenteClientesIa` (llmLoop enruta openai → agenteClientesIa). */
export async function ejecutarOpenAiAsistente({
  empresa,
  bot,
  tools,
  historialMensajes,
  ctx,
  conversacionId,
}) {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const inicio = Date.now();
  let toolCallsCount = 0;
  let tokensEntrada = 0;
  let tokensSalida = 0;

  const messages = [
    { role: 'system', content: buildSystemPromptV1({ empresa, bot, incluirPromptMaestro: true }) },
    ...mapearHistorialParaLlm(historialMensajes),
  ];

  const openAiTools = toOpenAiTools(tools);
  const modelo = env.OPENAI_MODEL || bot.modelo;

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
      const completion = await openai.chat.completions.create({
        model: modelo,
        temperature: bot.temperature ?? 0.4,
        messages,
        tools: openAiTools.length ? openAiTools : undefined,
      });

      tokensEntrada += completion.usage?.prompt_tokens ?? 0;
      tokensSalida += completion.usage?.completion_tokens ?? 0;

      const choice = completion.choices[0]?.message;
      if (!choice) {
        throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
      }

      const toolCalls = choice.tool_calls ?? [];
      if (toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: choice.content ?? '',
          tool_calls: toolCalls,
        });

        for (const tc of toolCalls) {
          toolCallsCount += 1;
          let args = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch {
            args = {};
          }
          const result = await ejecutarTool(tc.function.name, args, ctx, tools);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      const respuesta =
        choice.content?.trim() || 'Disculpá, no pude generar una respuesta. ¿Podés repetir?';

      await crearAgenteRunRepositorio({
        conversacionId,
        modelo,
        tokensEntrada,
        tokensSalida,
        latenciaMs: Date.now() - inicio,
        toolCallsCount,
        error: null,
      });

      return { respuesta, toolCallsCount, presupuestoId: null, pedidoId: null };
    }

    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  } catch (error) {
    await crearAgenteRunRepositorio({
      conversacionId,
      modelo,
      tokensEntrada,
      tokensSalida,
      latenciaMs: Date.now() - inicio,
      toolCallsCount,
      error: error.message ?? 'error',
    });

    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
}
