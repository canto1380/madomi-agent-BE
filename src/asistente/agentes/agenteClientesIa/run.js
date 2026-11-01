import { env } from '../../../config/env.js';
import { AppError } from '../../../errors/AppError.js';
import { ejecutarTool } from '../../tools/index.js';
import { crearAgenteRunRepositorio } from '../../../mongo/repositories/agenteRuns.repository.js';
import { buscarLeadPorIdRepositorio } from '../../../mongo/repositories/leads.repository.js';
import { normalizarEstadoConversacion } from '../../conversacion/estadoConversacion.js';
import { construirSystemPromptAgenteClientesIa } from './construirContextoLlm.js';
import { ejecutarCommerceKernelPostTurno } from '../../commerce/kernelPostTurno.js';
import { enriquecerRespuestaComercial } from '../../commerce/enriquecerRespuestaComercial.js';
import { resolverProveedorLlmAgenteClientes } from './resolverProveedorLlm.js';
import { cursorPromptTurnoAgente } from './proveedorCursorPrompt.js';
import { openAiPasoAgente } from './proveedorOpenAi.js';
import { parsearAccionModelo } from './parsearAccionModelo.js';
import { esSaludoPuro, respuestaSaludoRapido } from './turnoSaludoRapido.js';
import { withTimeout } from '../../loop/cursorRunTimeout.js';
import {
  formatearRespuestaPresupuestoDesdeTools,
  resolverAsistenciaTurnoDeterministico,
} from './asistirTurnoDeterministico.js';
import { extraerTextoRespuestaDesdeSalidaModelo } from './fallbackTextoModelo.js';
import { normalizarTextoRespuestaChat } from './normalizarTextoRespuestaChat.js';

const MAX_TOOL_ITERATIONS = 8;

function esErrorTimeout(err) {
  const msg = err?.message ?? '';
  return /TIMEOUT|CURSOR_AGENTE_CLIENTES_TIMEOUT|CHAT_TURN_TIMEOUT/.test(msg);
}

async function ejecutarAsistenciaDeterministica(asistencia, ctx, tools, leadDatos) {
  if (asistencia.tipo === 'respuesta') {
    return {
      respuestaLlm: asistencia.texto,
      resultadosTools: [],
      toolCallsCount: 0,
      modeloRun: 'agente-clientes-ia:atajo-deterministico',
    };
  }

  const resultadosTools = [];
  for (const llamada of asistencia.llamadas ?? []) {
    const result = await ejecutarTool(llamada.nombre, llamada.args ?? {}, ctx, tools);
    resultadosTools.push({ tool: llamada.nombre, result });
  }

  let respuestaLlm = 'Listo, revisé tu pedido. ¿Querés que sigamos con el presupuesto o el envío?';
  if (asistencia.formatear === 'presupuesto') {
    respuestaLlm = formatearRespuestaPresupuestoDesdeTools(resultadosTools, {
      leadTieneLocalidad: Boolean(leadDatos?.localidad),
    });
  }

  return {
    respuestaLlm,
    resultadosTools,
    toolCallsCount: asistencia.llamadas?.length ?? 0,
    modeloRun: 'agente-clientes-ia:atajo-deterministico',
  };
}

async function loopConCursor({
  systemPrompt,
  tools,
  historialMensajes,
  mensajeUsuario,
  ctx,
}) {
  const resultadosTools = [];
  let toolCallsCount = 0;
  let respuestaLlm = '';
  let reintentoJson = false;
  const modelId = env.CURSOR_MODEL || 'composer-2.5';

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
    const { texto } = await cursorPromptTurnoAgente({
      systemPrompt,
      tools,
      historialMensajes,
      mensajeUsuario,
      resultadosToolsTurno: resultadosTools,
      reintentoJson,
    });

    const accion = parsearAccionModelo(texto);

    if (accion.tipo === 'invalido') {
      if (!reintentoJson) {
        reintentoJson = true;
        continue;
      }
      const fallback = extraerTextoRespuestaDesdeSalidaModelo(texto);
      respuestaLlm =
        fallback ??
        'Disculpá, tuve un inconveniente técnico. ¿Podés repetir tu consulta en una frase?';
      break;
    }

    if (accion.tipo === 'tools') {
      for (const llamada of accion.llamadas) {
        toolCallsCount += 1;
        const result = await ejecutarTool(llamada.nombre, llamada.args ?? {}, ctx, tools);
        resultadosTools.push({ tool: llamada.nombre, result });
      }
      reintentoJson = false;
      continue;
    }

    respuestaLlm = accion.texto;
    break;
  }

  if (!respuestaLlm && toolCallsCount > 0) {
    respuestaLlm =
      'Listo, revisé la información. ¿Querés que arme el presupuesto o te cuento algo más?';
  }

  return { respuestaLlm, resultadosTools, toolCallsCount, modeloRun: `agente-clientes-ia:cursor:${modelId}` };
}

async function loopConOpenAi({
  systemPrompt,
  tools,
  historialMensajes,
  ctx,
  bot,
}) {
  const resultadosTools = [];
  let toolCallsCount = 0;
  let tokensEntrada = 0;
  let tokensSalida = 0;
  let messagesAcumulados = null;
  let respuestaLlm = '';
  const modelo = env.OPENAI_MODEL || bot.modelo;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
    const paso = await openAiPasoAgente({
      systemPrompt,
      tools,
      historialMensajes,
      messagesAcumulados,
      bot,
    });
    messagesAcumulados = paso.messages;
    tokensEntrada += paso.usage?.prompt_tokens ?? 0;
    tokensSalida += paso.usage?.completion_tokens ?? 0;

    const choice = paso.message;
    if (!choice) {
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
    }

    const toolCalls = choice.tool_calls ?? [];
    if (toolCalls.length > 0) {
      messagesAcumulados.push({
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
        resultadosTools.push({ tool: tc.function.name, result });
        messagesAcumulados.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    respuestaLlm = choice.content?.trim() || '';
    break;
  }

  return {
    respuestaLlm,
    resultadosTools,
    toolCallsCount,
    tokensEntrada,
    tokensSalida,
    modeloRun: `agente-clientes-ia:openai:${modelo}`,
  };
}

/**
 * Runtime producto: LLM (Cursor por defecto) + tools + commerce kernel.
 */
export async function ejecutarAgenteClientesIa({
  empresa,
  bot,
  tools,
  historialMensajes,
  ctx,
  conversacionId,
  contextoChat: contextoChatEntrada,
}) {
  const proveedor = resolverProveedorLlmAgenteClientes();
  if (!proveedor) {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }

  const ultimoUser = [...historialMensajes].reverse().find((m) => m.rol === 'user');
  const mensajeUsuario = ultimoUser?.contenido ?? '';

  const estadoInicial = normalizarEstadoConversacion(contextoChatEntrada);
  const lead = ctx.leadId ? await buscarLeadPorIdRepositorio(ctx.leadId) : null;
  const leadDatos = lead?.datosCapturados ?? null;

  const inicio = Date.now();
  let loopResult;

  try {
    if (esSaludoPuro(mensajeUsuario)) {
      loopResult = {
        respuestaLlm: respuestaSaludoRapido(empresa.nombre),
        resultadosTools: [],
        toolCallsCount: 0,
        modeloRun: `agente-clientes-ia:saludo-rapido`,
      };
    } else {
      const asistencia = resolverAsistenciaTurnoDeterministico({
        mensajeUsuario,
        estado: estadoInicial,
      });

      if (asistencia) {
        loopResult = await ejecutarAsistenciaDeterministica(asistencia, ctx, tools, leadDatos);
      } else {
        const systemPrompt = construirSystemPromptAgenteClientesIa({
          empresa,
          bot,
          estado: estadoInicial,
          leadDatos,
          compacto: proveedor === 'cursor',
        });

        const turnoMs = env.CHAT_TURN_TIMEOUT_MS || env.CURSOR_RUN_TIMEOUT_MS || 90_000;

        const ejecutarLoop = async () => {
          if (proveedor === 'cursor') {
            return loopConCursor({
              systemPrompt,
              tools,
              historialMensajes,
              mensajeUsuario,
              ctx,
            });
          }
          return loopConOpenAi({
            systemPrompt,
            tools,
            historialMensajes,
            ctx,
            bot,
          });
        };

        loopResult = await withTimeout(ejecutarLoop(), turnoMs, 'CHAT_TURN_TIMEOUT');
      }
    }

    const kernel = await ejecutarCommerceKernelPostTurno({
      estadoEntrada: estadoInicial,
      resultadosTools: loopResult.resultadosTools,
      ctx,
      tools,
      mensajeUsuario,
    });

    const respuesta = enriquecerRespuestaComercial(
      normalizarTextoRespuestaChat(loopResult.respuestaLlm),
      {
        pdfUrl: kernel.pdfUrl,
        totalPresupuesto: kernel.totalPresupuesto,
        moneda: empresa.moneda ?? 'ARS',
      },
    );

    await crearAgenteRunRepositorio({
      conversacionId,
      modelo: loopResult.modeloRun,
      tokensEntrada: loopResult.tokensEntrada ?? 0,
      tokensSalida: loopResult.tokensSalida ?? 0,
      latenciaMs: Date.now() - inicio,
      toolCallsCount: loopResult.toolCallsCount,
      error: null,
    });

    return {
      respuesta,
      toolCallsCount: loopResult.toolCallsCount,
      presupuestoId: kernel.presupuestoId,
      pedidoId: kernel.pedidoId,
      contextoChat: kernel.estado,
    };
  } catch (error) {
    await crearAgenteRunRepositorio({
      conversacionId,
      modelo: `agente-clientes-ia:${proveedor}`,
      tokensEntrada: 0,
      tokensSalida: 0,
      latenciaMs: Date.now() - inicio,
      toolCallsCount: 0,
      error: error.message ?? 'error',
    });

    if (esErrorTimeout(error)) {
      const kernel = await ejecutarCommerceKernelPostTurno({
        estadoEntrada: estadoInicial,
        resultadosTools: [],
        ctx,
        tools,
        mensajeUsuario,
      });
      return {
        respuesta:
          'Disculpá, me demoré más de lo usual en responder. ¿Podés repetir tu consulta? Si es urgente, escribinos por WhatsApp.',
        toolCallsCount: 0,
        presupuestoId: kernel.presupuestoId,
        pedidoId: kernel.pedidoId,
        contextoChat: kernel.estado,
      };
    }

    if (error instanceof AppError) {
      throw error;
    }

    const kernel = await ejecutarCommerceKernelPostTurno({
      estadoEntrada: estadoInicial,
      resultadosTools: [],
      ctx,
      tools,
      mensajeUsuario,
    });

    return {
      respuesta:
        'Disculpá, hubo un problema momentáneo al procesar tu mensaje. ¿Podés repetirlo? Si sigue fallando, escribinos por WhatsApp.',
      toolCallsCount: 0,
      presupuestoId: kernel.presupuestoId,
      pedidoId: kernel.pedidoId,
      contextoChat: kernel.estado,
    };
  }
}
