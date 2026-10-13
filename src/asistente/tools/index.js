import { buscarProductosTool } from './buscarProductos.js';
import { consultarPrecioTool } from './consultarPrecio.js';
import { consultarStockTool } from './consultarStock.js';
import { buscarPoliticasTool } from './buscarPoliticas.js';
import { consultarEnvioTool } from './consultarEnvio.js';
import { actualizarLeadTool } from './actualizarLead.js';
import { calcularPresupuestoTool } from './calcularPresupuesto.js';
import { generarPresupuestoPdfTool } from './generarPresupuestoPdf.js';
import { cerrarVentaTool } from './cerrarVenta.js';

/** Tools runtime fases 3–4. */
export const ALL_TOOLS = [
  buscarProductosTool,
  consultarPrecioTool,
  consultarStockTool,
  buscarPoliticasTool,
  consultarEnvioTool,
  actualizarLeadTool,
  calcularPresupuestoTool,
  generarPresupuestoPdfTool,
  cerrarVentaTool,
];

export function resolverToolsHabilitadas(nombresHabilitados = []) {
  const set = new Set(nombresHabilitados);
  return ALL_TOOLS.filter((t) => set.has(t.name));
}

export function toOpenAiTools(tools) {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export async function ejecutarTool(toolName, args, ctx, tools) {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    return { error: `Tool no habilitada: ${toolName}` };
  }
  return tool.execute(args, ctx);
}
