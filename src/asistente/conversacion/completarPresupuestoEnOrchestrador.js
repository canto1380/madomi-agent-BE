import { ejecutarTool } from '../tools/index.js';
import {
  productoCoincideLineaPedido,
  resolverItemsParaPresupuesto,
} from '../presupuesto/resolverItemsPresupuesto.js';

function uniqProductos(resultadosTools) {
  const map = new Map();
  for (const r of resultadosTools.filter((x) => x.tool === 'buscarProductos')) {
    for (const p of r.result?.productos ?? []) {
      map.set(p.id, p);
    }
  }
  return [...map.values()];
}

/**
 * Tras buscar productos, arma calcularPresupuesto (+ PDF) si hay ítems pendientes en estado.
 */
export async function completarPresupuestoEnOrchestrador({
  estado,
  resultadosTools,
  ctx,
  tools,
  leadDatos,
}) {
  const pendientes = estado.pedidoBorrador?.itemsPendientes ?? [];
  if (!pendientes.length) {
    return { resultadosTools, estado };
  }

  const productos = uniqProductos(resultadosTools);
  const items = [];

  for (const linea of pendientes) {
    const prod = productos.find((p) => productoCoincideLineaPedido(p, linea.search));
    if (prod) {
      items.push({ productoId: prod.id, cantidad: linea.cantidad });
    }
  }

  if (items.length !== pendientes.length) {
    return { resultadosTools, estado };
  }

  let nuevoEstado = {
    ...estado,
    pedidoBorrador: { items, itemsPendientes: [] },
  };

  const localidad = leadDatos?.localidad ?? estado.zonaEnvio ?? null;
  const puedeCerrarPresupuesto = Boolean(localidad);

  if (!puedeCerrarPresupuesto) {
    nuevoEstado = {
      ...nuevoEstado,
      esperandoAccion: 'localidad_para_presupuesto',
      ultimoTema: 'presupuesto',
    };
    return { resultadosTools, estado: nuevoEstado };
  }

  if (!tools.some((t) => t.name === 'calcularPresupuesto')) {
    return { resultadosTools, estado: nuevoEstado };
  }

  const calcResult = await ejecutarTool(
    'calcularPresupuesto',
    { items, tipoCliente: 'minorista' },
    ctx,
    tools,
  );
  resultadosTools.push({ tool: 'calcularPresupuesto', result: calcResult });

  if (calcResult?.ok && tools.some((t) => t.name === 'generarPresupuestoPdf')) {
    const pdfResult = await ejecutarTool('generarPresupuestoPdf', {}, ctx, tools);
    resultadosTools.push({ tool: 'generarPresupuestoPdf', result: pdfResult });
  }

  nuevoEstado = {
    ...nuevoEstado,
    presupuestoIdActivo: calcResult?.presupuestoId ? String(calcResult.presupuestoId) : null,
    esperandoAccion: null,
    ultimoTema: 'presupuesto',
  };

  return { resultadosTools, estado: nuevoEstado };
}

/** Localidad recién cargada + ítems ya resueltos en estado. */
export async function ejecutarPresupuestoPendienteConLocalidad({
  estado,
  resultadosTools,
  ctx,
  tools,
  leadDatos,
}) {
  const localidad = leadDatos?.localidad ?? estado.zonaEnvio ?? null;
  if (!localidad) {
    return { resultadosTools, estado };
  }

  const items = resolverItemsParaPresupuesto(estado, resultadosTools);
  if (!items.length || !tools.some((t) => t.name === 'calcularPresupuesto')) {
    return { resultadosTools, estado };
  }

  let calcResult = resultadosTools.find((r) => r.tool === 'calcularPresupuesto' && r.result?.ok)?.result;
  if (!calcResult) {
    calcResult = await ejecutarTool(
      'calcularPresupuesto',
      { items, tipoCliente: 'minorista' },
      ctx,
      tools,
    );
    resultadosTools.push({ tool: 'calcularPresupuesto', result: calcResult });
  }

  const yaPdf = resultadosTools.some((r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl);
  if (calcResult?.ok && !yaPdf && tools.some((t) => t.name === 'generarPresupuestoPdf')) {
    const pdfResult = await ejecutarTool(
      'generarPresupuestoPdf',
      { presupuestoId: calcResult.presupuestoId ? String(calcResult.presupuestoId) : undefined },
      ctx,
      tools,
    );
    resultadosTools.push({ tool: 'generarPresupuestoPdf', result: pdfResult });
  }

  return {
    resultadosTools,
    estado: {
      ...estado,
      pedidoBorrador: { items, itemsPendientes: [] },
      zonaEnvio: localidad,
      presupuestoIdActivo: calcResult?.presupuestoId
        ? String(calcResult.presupuestoId)
        : estado.presupuestoIdActivo,
      esperandoAccion: null,
    },
  };
}
