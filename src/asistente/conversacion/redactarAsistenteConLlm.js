import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { loadMadomiPromptRedaccion } from '../prompts/loadMadomiPrompt.js';
import { serializarHechosParaLlm } from './serializarHechosTools.js';
import { withTimeout } from '../loop/cursorRunTimeout.js';
import { extraerTextoRunResult } from '../loop/cursorSdkText.js';

function mapearHistorial(mensajes, max = 16) {
  return mensajes
    .filter((m) => m.rol === 'user' || m.rol === 'assistant')
    .slice(-max)
    .map((m) => ({
      role: m.rol === 'user' ? 'user' : 'assistant',
      content: m.contenido,
    }));
}

function armarSystemPrompt({ empresa, bot, hechosJson, borrador }) {
  const base = loadMadomiPromptRedaccion({ empresa, bot });

  return `${base}

## Borrador interno (orientación; podés reformular con naturalidad)
${borrador?.slice(0, 2500) || '(sin borrador)'}

---
## Datos verificados del sistema en este turno (OBLIGATORIO respetar; no inventar fuera de esto)
${hechosJson}

## Instrucción de salida
Respondé al cliente en español argentino natural, con el tono definido arriba.
Usá el historial de la conversación para continuidad (referencias como "el segundo", "¿cuánto sale?").
Si los hechos no alcanzan para confirmar algo, decilo con amabilidad y ofrecé el siguiente paso.
No expongas JSON, nombres de tools ni detalles internos del CRM.`;
}

async function redactarConOpenAi({ system, historial, temperature }) {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || 'gpt-4.1-mini',
    temperature: temperature ?? 0.55,
    messages: [{ role: 'system', content: system }, ...historial],
  });
  return completion.choices[0]?.message?.content?.trim() ?? null;
}

async function redactarConCursor({ system, historial, mensajeUsuario }) {
  const historialTexto = historial
    .map((m) => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`)
    .join('\n');

  const prompt = `${system}

## Historial reciente
${historialTexto || '(sin historial previo)'}

## Último mensaje del cliente
${mensajeUsuario}

Respondé solo con el texto que verá el cliente (sin prefijos ni metadatos).`;

  const modelId = env.CURSOR_MODEL || 'composer-2.5';
  const { Agent } = await import('@cursor/sdk');

  const runResult = await withTimeout(
    Agent.prompt(prompt, {
      apiKey: env.CURSOR_API_KEY,
      model: { id: modelId },
      cloud: {
        metadata: { app: 'madomi-chat', env: env.NODE_ENV, mode: 'redact' },
      },
    }),
    env.CURSOR_RUN_TIMEOUT_MS,
    'CURSOR_PROMPT_TIMEOUT',
  );

  if (runResult.status === 'error') {
    throw new Error(runResult.error?.message ?? 'cursor_run_error');
  }

  const bruto = runResult.result;
  const texto =
    (typeof bruto === 'string' ? bruto : bruto?.text)?.trim() ||
    extraerTextoRunResult(runResult)?.trim() ||
    null;
  return texto;
}

/**
 * Redacción final estilo Assistant: prompt maestro + historial + hechos de tools.
 */
export async function redactarAsistenteConLlm({
  empresa,
  bot,
  mensajeUsuario,
  borrador,
  historialMensajes = [],
  resultadosTools = [],
  estado = {},
  intencion = null,
  provider,
}) {
  const hechosJson = serializarHechosParaLlm({
    resultadosTools,
    estado,
    intencion,
    borrador,
  });
  const system = armarSystemPrompt({ empresa, bot, hechosJson, borrador });
  const historial = mapearHistorial(historialMensajes, env.CHAT_HISTORIAL_MAX_MENSAJES);

  const ultimo = historial[historial.length - 1];
  if (!ultimo || ultimo.role !== 'user' || ultimo.content !== mensajeUsuario) {
    historial.push({ role: 'user', content: mensajeUsuario });
  }

  try {
    if (provider === 'openai' && env.OPENAI_API_KEY) {
      const texto = await redactarConOpenAi({
        system,
        historial,
        temperature: bot?.temperature ?? 0.55,
      });
      return texto || borrador;
    }

    if (provider === 'cursor' && env.CURSOR_API_KEY) {
      const texto = await redactarConCursor({
        system,
        historial: historial.slice(0, -1),
        mensajeUsuario,
      });
      return texto || borrador;
    }
  } catch (err) {
    console.warn('[asistente] redacción LLM falló, usando borrador:', err.message);
  }

  return borrador;
}
