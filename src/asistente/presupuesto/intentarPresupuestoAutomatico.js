import { ejecutarTool } from '../tools/index.js';
import { resolverItemsParaPresupuesto } from './resolverItemsPresupuesto.js';

/**
 * Calcula presupuesto + PDF cuando hay ítems resolubles, localidad y datos mínimos.
 */
export async function intentarPresupuestoAutomatico({
  estado,
  resultadosTools,
  ctx,
  tools,
  leadDatos,
  tipoCliente = 'minorista',
}) {
  const localidad = leadDatos?.localidad ?? estado.zonaEnvio ?? null;
  if (!localidad) {
    return { resultadosTools, estado };
  }

  const items = resolverItemsParaPresupuesto(estado, resultadosTools);
  if (!items.length) {
    return { resultadosTools, estado };
  }

  const yaCalculado = resultadosTools.some((r) => r.tool === 'calcularPresupuesto' && r.result?.ok);
  if (yaCalculado) {
    return { resultadosTools, estado };
  }

  if (!tools.some((t) => t.name === 'calcularPresupuesto')) {
    return { resultadosTools, estado };
  }

  const calcResult = await ejecutarTool(
    'calcularPresupuesto',
    { items, tipoCliente },
    ctx,
    tools,
  );
  resultadosTools.push({ tool: 'calcularPresupuesto', result: calcResult });

  let nuevoEstado = {
    ...estado,
    pedidoBorrador: { items, itemsPendientes: [] },
    zonaEnvio: localidad,
    esperandoAccion: null,
    ultimoTema: 'presupuesto',
    presupuestoIdActivo: calcResult?.presupuestoId ? String(calcResult.presupuestoId) : estado.presupuestoIdActivo,
  };

  const yaPdf = resultadosTools.some((r) => r.tool === 'generarPresupuestoPdf' && r.result?.pdfUrl);
  if (calcResult?.ok && !yaPdf && tools.some((t) => t.name === 'generarPresupuestoPdf')) {
    const pdfResult = await ejecutarTool('generarPresupuestoPdf', {}, ctx, tools);
    resultadosTools.push({ tool: 'generarPresupuestoPdf', result: pdfResult });
  }

  return { resultadosTools, estado: nuevoEstado };
}
