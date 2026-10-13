import { z } from 'zod';
import { obtenerProductoComercialPorIdRepositorio } from '../../repositories/productos.repository.js';
import {
  calcularPrecioConOferta,
  obtenerPrecioBase,
  ofertaVigente,
  resolverTipoClientePrecio,
} from '../productoComercial.js';
import { agregarProductoInteresLeadRepositorio } from '../../mongo/repositories/leads.repository.js';

const argsSchema = z.object({
  productoId: z.string().min(1),
  tipoCliente: z.enum(['minorista', 'mayorista']).default('minorista'),
  cantidad: z.number().positive().optional(),
});

export const consultarPrecioTool = {
  name: 'consultarPrecio',
  description: 'Consulta precio vigente de un producto (minorista o mayorista) con oferta si aplica.',
  parameters: {
    type: 'object',
    properties: {
      productoId: { type: 'string' },
      tipoCliente: { type: 'string', enum: ['minorista', 'mayorista'] },
      cantidad: { type: 'number', description: 'Cantidad para evaluar umbral mayorista del producto' },
    },
    required: ['productoId'],
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const producto = await obtenerProductoComercialPorIdRepositorio(args.productoId);
    if (!producto) {
      return { encontrado: false, mensaje: 'Producto no disponible comercialmente' };
    }

    const tipoPrecioAplicado = resolverTipoClientePrecio(producto, {
      tipoCliente: args.tipoCliente,
      cantidad: args.cantidad ?? null,
    });
    const precioBase = obtenerPrecioBase(producto, args.tipoCliente, args.cantidad ?? null);
    const precioFinal = calcularPrecioConOferta(precioBase, producto);

    if (ctx.leadId) {
      await agregarProductoInteresLeadRepositorio(ctx.leadId, {
        productoId: producto.id,
        nombreSnapshot: producto.nombre,
        categoriaSnapshot: producto.categoria,
      });
    }

    const precioMayoristaBase = producto.precioMayorista != null ? Number(producto.precioMayorista) : null;
    const precioMinoristaBase =
      producto.precioMinorista != null ? Number(producto.precioMinorista) : null;

    return {
      encontrado: true,
      productoId: producto.id,
      nombre: producto.nombre,
      tipoCliente: args.tipoCliente,
      tipoPrecioAplicado,
      cantidadMinimaMayorista: producto.cantidadMinimaMayorista ?? null,
      moneda: 'ARS',
      precioBase: precioBase != null ? Number(precioBase) : null,
      precioFinal,
      precioMayoristaDisponible: precioMayoristaBase != null,
      precioMinoristaDisponible: precioMinoristaBase != null,
      precioMayoristaLista: precioMayoristaBase,
      precioMinoristaLista: precioMinoristaBase,
      unidadStock: producto.unidadStock ?? 'unidades',
      ofertaActiva: ofertaVigente(producto),
      ofertaPorcentaje: ofertaVigente(producto) ? producto.ofertaPorcentaje : null,
    };
  },
};
