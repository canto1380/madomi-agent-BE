import { ejecutarTool } from '../tools/index.js';
import { crearAgenteRunRepositorio } from '../../mongo/repositories/agenteRuns.repository.js';
import { consultarPrecioTool } from '../tools/consultarPrecio.js';
import { consultarStockTool } from '../tools/consultarStock.js';
import { interpretarTurno, INTENCION } from '../conversacion/interpretarTurno.js';
import {
  normalizarEstadoConversacion,
  registrarProductosMostrados,
  registrarProductosConsultados,
} from '../conversacion/estadoConversacion.js';
import { redactarRespuestaConversacional } from '../conversacion/redactarRespuestaConversacional.js';
import { redactarAsistenteConLlm } from '../conversacion/redactarAsistenteConLlm.js';
import { resolverModoRedaccion } from '../conversacion/resolverModoRedaccion.js';
import { debeRedactarTurnoConLlm } from '../conversacion/debeRedactarTurno.js';
import {
  completarPresupuestoEnOrchestrador,
  ejecutarPresupuestoPendienteConLocalidad,
} from '../conversacion/completarPresupuestoEnOrchestrador.js';
import { intentarPresupuestoAutomatico } from '../presupuesto/intentarPresupuestoAutomatico.js';
import {
  agregarLineasAlCarritoSesion,
  resolverItemsParaPresupuesto,
} from '../presupuesto/resolverItemsPresupuesto.js';
import { withTimeout } from './cursorRunTimeout.js';
import { env } from '../../config/env.js';
import { buscarLeadPorIdRepositorio } from '../../mongo/repositories/leads.repository.js';
import {
  detectarPreferenciaContacto,
  mensajePideConfirmacionContacto,
  registrarSeguimientoComercialLead,
} from '../conversacion/seguimientoComercial.js';

function uniqProductosDesdeResultados(resultadosTools) {
  const map = new Map();
  for (const r of resultadosTools.filter((x) => x.tool === 'buscarProductos')) {
    for (const p of r.result?.productos ?? []) {
      map.set(p.id, p);
    }
  }
  return [...map.values()];
}

async function enriquecerPrecioStockTrasBusqueda(resultadosTools, ctx, tools, intencion, opciones = {}) {
  const productos = uniqProductosDesdeResultados(resultadosTools);
  const pidePrecio =
    intencion === INTENCION.PRECIO ||
    intencion === INTENCION.BUSQUEDA_PRODUCTO ||
    intencion === INTENCION.PRECIO_REFERENCIA;
  const pideStock = intencion === INTENCION.STOCK;
  const idsPrecio = new Set(
    resultadosTools.filter((r) => r.tool === 'consultarPrecio').map((r) => r.result?.productoId),
  );

  const tipoClientePrecio = opciones.tipoClientePrecio ?? 'minorista';
  const maxProductosPrecio = intencion === INTENCION.PRECIO ? 8 : 3;
  for (const producto of productos.slice(0, maxProductosPrecio)) {
    if (pidePrecio && tools.some((t) => t.name === 'consultarPrecio') && !idsPrecio.has(producto.id)) {
      const result = await consultarPrecioTool.execute(
        { productoId: producto.id, tipoCliente: tipoClientePrecio, cantidad: opciones.cantidad ?? 1 },
        ctx,
      );
      resultadosTools.push({ tool: 'consultarPrecio', result });
      idsPrecio.add(producto.id);
    }
    if (pideStock && tools.some((t) => t.name === 'consultarStock')) {
      const result = await consultarStockTool.execute({ productoId: producto.id }, ctx);
      resultadosTools.push({ tool: 'consultarStock', result });
    }
  }
  return resultadosTools;
}

function extraerPresupuestoPedidoIds(resultadosTools) {
  const presupuestoResult =
    resultadosTools.find((r) => r.tool === 'calcularPresupuesto')?.result ??
    resultadosTools.find((r) => r.tool === 'generarPresupuestoPdf')?.result;
  const presupuestoId =
    presupuestoResult?.ok && presupuestoResult.presupuestoId ? presupuestoResult.presupuestoId : null;
  const cierreResult = resultadosTools.find((r) => r.tool === 'cerrarVenta')?.result;
  const pedidoId = cierreResult?.ok && cierreResult.pedidoId ? cierreResult.pedidoId : null;
  return { presupuestoId, pedidoId };
}

export async function ejecutarOrchestradorAsistente({
  empresa,
  bot,
  tools,
  historialMensajes,
  ctx,
  conversacionId,
  contextoChat: contextoChatEntrada,
}) {
  const inicio = Date.now();
  const ultimoUser = [...historialMensajes].reverse().find((m) => m.rol === 'user');
  const mensaje = ultimoUser?.contenido ?? '';

  let estado = normalizarEstadoConversacion(contextoChatEntrada);
  const { intencion, plan, slots, actualizarEstado, saludo } = interpretarTurno(
    mensaje,
    estado,
    historialMensajes,
  );

  let toolCallsCount = 0;
  let resultadosTools = [];

  for (const paso of plan) {
    if (!tools.some((t) => t.name === paso.tool)) {
      continue;
    }
    toolCallsCount += 1;
    const result = await ejecutarTool(paso.tool, paso.args, ctx, tools);
    resultadosTools.push({ tool: paso.tool, result });
  }

  const tipoClientePrecio = plan.some(
    (p) => p.tool === 'consultarPrecio' && p.args?.tipoCliente === 'mayorista',
  )
    ? 'mayorista'
    : actualizarEstado.ultimoTema === 'precio_mayorista'
      ? 'mayorista'
      : 'minorista';

  await enriquecerPrecioStockTrasBusqueda(resultadosTools, ctx, tools, intencion, {
    tipoClientePrecio,
  });

  estado = { ...estado, ...actualizarEstado, intencionActual: intencion };

  let leadParaPresup = ctx.leadId ? await buscarLeadPorIdRepositorio(ctx.leadId) : null;
  ({ resultadosTools, estado } = await completarPresupuestoEnOrchestrador({
    estado,
    resultadosTools,
    ctx,
    tools,
    leadDatos: leadParaPresup?.datosCapturados,
  }));

  const itemsResueltos = resolverItemsParaPresupuesto(estado, resultadosTools);
  if (itemsResueltos.length) {
    estado = agregarLineasAlCarritoSesion(
      estado,
      itemsResueltos.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    );
  }

  if (
    intencion === INTENCION.PRESUPUESTO ||
    intencion === INTENCION.DATOS_CONTACTO ||
    intencion === INTENCION.PEDIDO ||
    estado.esperandoAccion === 'localidad_para_presupuesto' ||
    slots.forzarPresupuesto
  ) {
    leadParaPresup = ctx.leadId ? await buscarLeadPorIdRepositorio(ctx.leadId) : null;
    if (leadParaPresup?.datosCapturados?.localidad) {
      estado = { ...estado, zonaEnvio: leadParaPresup.datosCapturados.localidad };
    }
    ({ resultadosTools, estado } = await ejecutarPresupuestoPendienteConLocalidad({
      estado,
      resultadosTools,
      ctx,
      tools,
      leadDatos: leadParaPresup?.datosCapturados,
    }));
    ({ resultadosTools, estado } = await intentarPresupuestoAutomatico({
      estado,
      resultadosTools,
      ctx,
      tools,
      leadDatos: leadParaPresup?.datosCapturados,
      tipoCliente: tipoClientePrecio,
    }));

    const yaPdf = resultadosTools.some((r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl);
    const presupuestoActivo =
      estado.presupuestoIdActivo ??
      resultadosTools.find((r) => r.tool === 'calcularPresupuesto' && r.result?.presupuestoId)?.result
        ?.presupuestoId;
    if (
      !yaPdf &&
      presupuestoActivo &&
      leadParaPresup?.datosCapturados?.localidad &&
      tools.some((t) => t.name === 'generarPresupuestoPdf')
    ) {
      const pdfResult = await ejecutarTool(
        'generarPresupuestoPdf',
        { presupuestoId: String(presupuestoActivo) },
        ctx,
        tools,
      );
      resultadosTools.push({ tool: 'generarPresupuestoPdf', result: pdfResult });
    }
  }

  const productos = uniqProductosDesdeResultados(resultadosTools);
  if (productos.length) {
    estado = registrarProductosMostrados(estado, productos);
  }

  if (slots.productoReferencia) {
    estado = { ...estado, productoActual: slots.productoReferencia };
  }

  const preciosOk = resultadosTools
    .filter((r) => r.tool === 'consultarPrecio' && r.result?.encontrado)
    .map((r) => r.result);
  if (preciosOk.length) {
    estado = registrarProductosConsultados(estado, preciosOk);
  }

  if (presupuestoIdFromTools(resultadosTools)) {
    estado = { ...estado, presupuestoIdActivo: String(presupuestoIdFromTools(resultadosTools)) };
  }

  const lead = ctx.leadId ? await buscarLeadPorIdRepositorio(ctx.leadId) : null;
  let borrador = redactarRespuestaConversacional({
    intencion,
    saludo,
    resultadosTools,
    empresaNombre: empresa.nombre,
    estado,
    slots,
    leadDatos: lead?.datosCapturados,
  });

  const modoRedaccion = resolverModoRedaccion({ runtime: env.ASISTENTE_RUNTIME });
  let modeloRun = `conversacional:${bot.systemPromptVersion ?? 'v1'}`;
  const borradorBase = borrador;

  if (modoRedaccion && debeRedactarTurnoConLlm(intencion, mensaje)) {
    const timeoutMs = env.ASISTENTE_REDACT_TIMEOUT_MS || 28_000;
    try {
      borrador = await withTimeout(
        redactarAsistenteConLlm({
          empresa,
          bot,
          mensajeUsuario: mensaje,
          borrador: borradorBase,
          historialMensajes,
          resultadosTools,
          estado,
          intencion,
          provider: modoRedaccion,
        }),
        timeoutMs,
        'REDACT_TIMEOUT',
      );
      modeloRun =
        modoRedaccion === 'cursor'
          ? `cursor-redact:${env.CURSOR_MODEL || 'composer-2.5'}`
          : `openai-redact:${env.OPENAI_MODEL || bot.modelo}`;
    } catch (err) {
      console.warn('[asistente] redacción LLM timeout/error, borrador:', err.message);
      borrador = borradorBase;
    }
  }

  const { presupuestoId, pedidoId } = extraerPresupuestoPedidoIds(resultadosTools);

  if (ctx.leadId) {
    const preciosMayoristaSinTarifa = resultadosTools.filter(
      (r) =>
        r.tool === 'consultarPrecio' &&
        r.result?.tipoCliente === 'mayorista' &&
        r.result?.encontrado &&
        r.result?.precioMayoristaDisponible === false,
    );
    if (preciosMayoristaSinTarifa.length) {
      const nombres = preciosMayoristaSinTarifa.map((r) => r.result.nombre).join(', ');
      await registrarSeguimientoComercialLead(ctx, {
        motivo: 'cotizacion_mayorista',
        notas: `Cotización mayorista pendiente: ${nombres}`,
        cuelloBotella: 'precio',
        preferenciaCanal: detectarPreferenciaContacto(mensaje),
      });
    }
    const presupuestoGenerado = resultadosTools.some(
      (r) => r.tool === 'calcularPresupuesto' && r.result?.ok,
    );
    if (
      slots.registrarSeguimiento &&
      !presupuestoGenerado &&
      !resultadosTools.some((r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl)
    ) {
      await registrarSeguimientoComercialLead(ctx, {
        ...slots.registrarSeguimiento,
        preferenciaCanal:
          slots.registrarSeguimiento.preferenciaCanal ?? detectarPreferenciaContacto(mensaje),
      });
    } else if (mensajePideConfirmacionContacto(mensaje) && !presupuestoGenerado) {
      await registrarSeguimientoComercialLead(ctx, {
        motivo: 'confirmacion_contacto',
        notas: 'Cliente consultó si el equipo se comunicará.',
        preferenciaCanal: detectarPreferenciaContacto(mensaje),
      });
    }
  }

  await crearAgenteRunRepositorio({
    conversacionId,
    modelo: modeloRun,
    tokensEntrada: 0,
    tokensSalida: 0,
    latenciaMs: Date.now() - inicio,
    toolCallsCount,
    error: null,
  });

  return {
    respuesta: borrador,
    toolCallsCount,
    presupuestoId,
    pedidoId,
    contextoChat: estado,
  };
}

function presupuestoIdFromTools(resultadosTools) {
  const p = resultadosTools.find((r) => r.tool === 'calcularPresupuesto')?.result;
  return p?.ok && p.presupuestoId ? p.presupuestoId : null;
}
