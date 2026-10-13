import {
  confirmarEntregaStockRepositorio,
  liberarCompromisoStockRepositorio,
} from './stockComercial.js';

const ESTADOS_FINALES_ENTREGA = new Set(['entregado']);
const ESTADOS_CANCELACION = new Set(['cancelado']);

/**
 * Aplica movimiento de stock según cambio de estado logístico del pedido.
 * @param {object} pedido — documento Pedido (lean)
 * @param {string} estadoAnterior
 * @param {string} estadoNuevo
 */
export async function aplicarTransicionStockPedido(pedido, estadoAnterior, estadoNuevo) {
  if (!pedido?.items?.length || pedido.stockReserva !== 'comprometido') {
    return { aplicado: false, motivo: 'sin_reserva_comprometida' };
  }

  if (estadoAnterior === estadoNuevo) {
    return { aplicado: false, motivo: 'sin_cambio' };
  }

  const resultados = [];

  if (ESTADOS_FINALES_ENTREGA.has(estadoNuevo) && !ESTADOS_FINALES_ENTREGA.has(estadoAnterior)) {
    for (const item of pedido.items) {
      const r = await confirmarEntregaStockRepositorio(item.productoId, item.cantidad);
      resultados.push({ productoId: item.productoId, accion: 'entrega', ...r });
    }
    return { aplicado: true, accion: 'entrega', resultados };
  }

  if (ESTADOS_CANCELACION.has(estadoNuevo) && !ESTADOS_CANCELACION.has(estadoAnterior)) {
    for (const item of pedido.items) {
      const r = await liberarCompromisoStockRepositorio(item.productoId, item.cantidad);
      resultados.push({ productoId: item.productoId, accion: 'liberar', ...r });
    }
    return { aplicado: true, accion: 'liberar', resultados };
  }

  return { aplicado: false, motivo: 'transicion_sin_efecto_stock' };
}
