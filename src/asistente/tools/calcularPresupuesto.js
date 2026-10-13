import { z } from 'zod';
import { obtenerProductoComercialPorIdRepositorio } from '../../repositories/productos.repository.js';
import {
  calcularPrecioConOferta,
  obtenerPrecioBase,
  ofertaVigente,
  resolverTipoClientePrecio,
} from '../productoComercial.js';
import { upsertPresupuestoBorradorRepositorio } from '../../mongo/repositories/presupuestos.repository.js';
import { buscarEmpresaPorIdRepositorio } from '../../mongo/repositories/empresas.repository.js';
import { actualizarLeadRepositorio } from '../../mongo/repositories/leads.repository.js';

const itemSchema = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().positive(),
});

const argsSchema = z.object({
  items: z.array(itemSchema).min(1),
  tipoCliente: z.enum(['minorista', 'mayorista']).default('minorista'),
  costoEnvio: z.number().min(0).optional().default(0),
});

function lineaPresupuesto(producto, cantidad, tipoCliente) {
  const tipoPrecioAplicado = resolverTipoClientePrecio(producto, { tipoCliente, cantidad });
  const precioBase = obtenerPrecioBase(producto, tipoCliente, cantidad);
  const precioUnitario = calcularPrecioConOferta(precioBase, producto);
  const descuentoPorcentaje =
    ofertaVigente(producto) && producto.ofertaPorcentaje ? producto.ofertaPorcentaje : 0;
  const subtotalLinea =
    precioUnitario != null ? Math.round(precioUnitario * cantidad * 100) / 100 : 0;

  return {
    productoId: producto.id,
    nombreSnapshot: producto.nombre,
    cantidad,
    unidad: producto.unidadStock ?? 'un',
    precioUnitarioSnapshot: precioUnitario,
    descuentoPorcentaje,
    subtotalLinea,
    precioPendiente: precioUnitario == null,
    tipoPrecioAplicado,
  };
}

export const calcularPresupuestoTool = {
  name: 'calcularPresupuesto',
  description:
    'Arma o actualiza un presupuesto borrador con ítems, precios desde Postgres y totales en ARS.',
  parameters: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productoId: { type: 'string' },
            cantidad: { type: 'number' },
          },
          required: ['productoId', 'cantidad'],
        },
      },
      tipoCliente: { type: 'string', enum: ['minorista', 'mayorista'] },
      costoEnvio: { type: 'number' },
    },
    required: ['items'],
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const lineas = [];
    let subtotal = 0;
    let hayPrecioPendiente = false;

    for (const item of args.items) {
      const producto = await obtenerProductoComercialPorIdRepositorio(item.productoId);
      if (!producto) {
        return {
          ok: false,
          error: 'PRODUCTO_NO_DISPONIBLE',
          productoId: item.productoId,
        };
      }
      const linea = lineaPresupuesto(producto, item.cantidad, args.tipoCliente);
      if (linea.precioPendiente) {
        hayPrecioPendiente = true;
      }
      subtotal += linea.subtotalLinea;
      lineas.push(linea);
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const costoEnvio = args.costoEnvio ?? 0;
    const total = Math.round((subtotal + costoEnvio) * 100) / 100;

    const empresa = await buscarEmpresaPorIdRepositorio(ctx.empresaId);
    const horasValidez = empresa?.vigenciaPresupuestoHoras ?? 72;
    const validezHasta = new Date(Date.now() + horasValidez * 60 * 60 * 1000);

    const presupuesto = await upsertPresupuestoBorradorRepositorio({
      empresaId: ctx.empresaId,
      leadId: ctx.leadId,
      conversacionId: ctx.conversacionId,
      clienteId: ctx.clienteId ?? null,
      items: lineas.map(({ precioPendiente: _p, ...rest }) => rest),
      subtotal,
      descuentoTotal: 0,
      costoEnvio,
      total,
      moneda: 'ARS',
      validezHasta,
    });

    if (ctx.leadId) {
      await actualizarLeadRepositorio(ctx.leadId, {
        estado: 'presupuesto_abierto',
      });
    }

    return {
      ok: true,
      presupuestoId: String(presupuesto._id),
      estado: presupuesto.estado,
      moneda: 'ARS',
      subtotal,
      costoEnvio,
      total,
      validezHasta: validezHasta.toISOString(),
      hayPrecioPendiente,
      items: lineas.map(({ productoId, nombreSnapshot, cantidad, subtotalLinea, precioUnitarioSnapshot }) => ({
        productoId,
        nombreSnapshot,
        cantidad,
        subtotalLinea,
        precioUnitarioSnapshot,
      })),
    };
  },
};
