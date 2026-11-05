import { z } from 'zod';
import { obtenerProductoComercialPorIdRepositorio } from '../../repositories/productos.repository.js';
import { calcularStockDisponible } from '../stock/stockComercial.js';

const argsSchema = z.object({
  productoId: z.string().min(1),
});

export const consultarStockTool = {
  name: 'consultarStock',
  description: 'Consulta stock disponible de un producto.',
  parameters: {
    type: 'object',
    properties: {
      productoId: { type: 'string' },
    },
    required: ['productoId'],
  },
  async execute(rawArgs) {
    const args = argsSchema.parse(rawArgs);
    const producto = await obtenerProductoComercialPorIdRepositorio(args.productoId);
    if (!producto) {
      return { status: 'producto_no_encontrado', encontrado: false, productoId: args.productoId };
    }
    const stockDisponible = calcularStockDisponible(producto);
    return {
      status: stockDisponible > 0 ? 'stock_disponible' : 'sin_stock',
      encontrado: true,
      productoId: producto.id,
      nombre: producto.nombre,
      stockUnidades: producto.stockUnidades,
      stockComprometido: producto.stockComprometidoUnidades ?? 0,
      stockDisponible,
      unidadStock: producto.unidadStock,
      disponible: stockDisponible > 0,
    };
  },
};
