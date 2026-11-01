import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { toOpenAiTools } from '../../tools/index.js';

function mapearHistorialParaLlm(mensajes, maxTurnos = env.CHAT_HISTORIAL_MAX_MENSAJES) {
  const relevantes = mensajes.filter((m) => m.rol === 'user' || m.rol === 'assistant');
  return relevantes.slice(-maxTurnos).map((m) => ({
    role: m.rol === 'user' ? 'user' : 'assistant',
    content: m.contenido,
  }));
}

/**
 * Un paso del loop OpenAI (function calling nativo). Opcional / fallback.
 */
export async function openAiPasoAgente({
  systemPrompt,
  tools,
  historialMensajes,
  messagesAcumulados,
  bot,
}) {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const modelo = env.OPENAI_MODEL || bot.modelo;

  const messages =
    messagesAcumulados ??
    [{ role: 'system', content: systemPrompt }, ...mapearHistorialParaLlm(historialMensajes)];

  const completion = await openai.chat.completions.create({
    model: modelo,
    temperature: bot.temperature ?? 0.35,
    messages,
    tools: toOpenAiTools(tools).length ? toOpenAiTools(tools) : undefined,
  });

  const choice = completion.choices[0]?.message;
  return {
    message: choice,
    messages,
    modelo,
    usage: completion.usage,
  };
}
