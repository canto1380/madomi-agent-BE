import { ejecutarTool } from '../tools/index.js';
import { buscarLeadPorIdRepositorio } from '../../mongo/repositories/leads.repository.js';
import {
  ejecutarPresupuestoPendienteConLocalidad,
} from '../conversacion/completarPresupuestoEnOrchestrador.js';
import { intentarPresupuestoAutomatico } from '../presupuesto/intentarPresupuestoAutomatico.js';
import {
  agregarLineasAlCarritoSesion,
  resolverItemsParaPresupuesto,
} from '../presupuesto/resolverItemsPresupuesto.js';
import {
  detectarPreferenciaContacto,
  mensajePideConfirmacionContacto,
  registrarSeguimientoComercialLead,
} from '../conversacion/seguimientoComercial.js';
import { extraerPresupuestoPedidoIds } from './extraerIdsComerciales.js';
import { sincronizarEstadoDesdeTools } from './sincronizarEstadoDesdeTools.js';

function tipoClienteDesdeTools(resultadosTools) {
  const mayor = resultadosTools.some(
    (r) => r.tool === 'consultarPrecio' && r.result?.tipoCliente === 'mayorista',
  );
  return mayor ? 'mayorista' : 'minorista';
}

/**
 * Cierre comercial determinista tras el turno LLM: PDF, carrito, CRM.
 */
export async function ejecutarCommerceKernelPostTurno({
  estadoEntrada,
  resultadosTools,
  ctx,
  tools,
  mensajeUsuario,
}) {
  let resultadosToolsOut = [...resultadosTools];
  let leadDatos = ctx.leadId ? (await buscarLeadPorIdRepositorio(ctx.leadId))?.datosCapturados : null;

  let estado = sincronizarEstadoDesdeTools(estadoEntrada, resultadosToolsOut, leadDatos);

  const itemsResueltos = resolverItemsParaPresupuesto(estado, resultadosToolsOut);
  if (itemsResueltos.length) {
    estado = agregarLineasAlCarritoSesion(
      estado,
      itemsResueltos.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    );
  }

  const huboActualizarLead = resultadosToolsOut.some((r) => r.tool === 'actualizarLead');
  if (huboActualizarLead && ctx.leadId) {
    leadDatos = (await buscarLeadPorIdRepositorio(ctx.leadId))?.datosCapturados ?? leadDatos;
    if (leadDatos?.localidad) {
      estado = { ...estado, zonaEnvio: leadDatos.localidad, esperandoAccion: null };
    }
  }

  const debeIntentarPresupuesto =
    Boolean(leadDatos?.localidad) &&
    (huboActualizarLead ||
      estado.esperandoAccion === 'localidad_para_presupuesto' ||
      resolverItemsParaPresupuesto(estado, resultadosToolsOut).length > 0);

  if (debeIntentarPresupuesto) {
    ({ resultadosTools: resultadosToolsOut, estado } = await ejecutarPresupuestoPendienteConLocalidad({
      estado,
      resultadosTools: resultadosToolsOut,
      ctx,
      tools,
      leadDatos,
    }));
    ({ resultadosTools: resultadosToolsOut, estado } = await intentarPresupuestoAutomatico({
      estado,
      resultadosTools: resultadosToolsOut,
      ctx,
      tools,
      leadDatos,
      tipoCliente: tipoClienteDesdeTools(resultadosToolsOut),
    }));

    const yaPdf = resultadosToolsOut.some((r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl);
    const presupuestoActivo =
      estado.presupuestoIdActivo ??
      resultadosToolsOut.find((r) => r.tool === 'calcularPresupuesto' && r.result?.presupuestoId)?.result
        ?.presupuestoId;

    if (
      !yaPdf &&
      presupuestoActivo &&
      leadDatos?.localidad &&
      tools.some((t) => t.name === 'generarPresupuestoPdf')
    ) {
      const pdfResult = await ejecutarTool(
        'generarPresupuestoPdf',
        { presupuestoId: String(presupuestoActivo) },
        ctx,
        tools,
      );
      resultadosToolsOut.push({ tool: 'generarPresupuestoPdf', result: pdfResult });
    }

    estado = sincronizarEstadoDesdeTools(estado, resultadosToolsOut, leadDatos);
  }

  if (ctx.leadId) {
    const preciosMayoristaSinTarifa = resultadosToolsOut.filter(
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
        preferenciaCanal: detectarPreferenciaContacto(mensajeUsuario),
      });
    }

    const presupuestoGenerado = resultadosToolsOut.some(
      (r) => r.tool === 'calcularPresupuesto' && r.result?.ok,
    );
    const pdfGenerado = resultadosToolsOut.some(
      (r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl,
    );

    if (mensajePideConfirmacionContacto(mensajeUsuario) && !presupuestoGenerado && !pdfGenerado) {
      await registrarSeguimientoComercialLead(ctx, {
        motivo: 'confirmacion_contacto',
        notas: 'Cliente consultó si el equipo se comunicará.',
        preferenciaCanal: detectarPreferenciaContacto(mensajeUsuario),
      });
    }
  }

  const { presupuestoId, pedidoId } = extraerPresupuestoPedidoIds(resultadosToolsOut);
  const pdfUrl =
    resultadosToolsOut.find((r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl)?.result
      ?.pdfUrl ?? null;

  return {
    estado,
    resultadosTools: resultadosToolsOut,
    presupuestoId,
    pedidoId,
    pdfUrl,
    totalPresupuesto:
      resultadosToolsOut.find((r) => r.tool === 'calcularPresupuesto' && r.result?.ok)?.result
        ?.total ?? null,
  };
}
