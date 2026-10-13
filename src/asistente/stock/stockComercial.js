import { prisma } from '../../providers/prisma.js';

const whereComercialActivo = {
  activo: true,
  activoComercial: true,
};

export function calcularStockDisponible(producto) {
  const fisico = producto.stockUnidades ?? 0;
  const comprometido = producto.stockComprometidoUnidades ?? 0;
  return Math.max(0, fisico - comprometido);
}

async function obtenerProductoTx(tx, productoId) {
  return tx.productos.findFirst({
    where: { id: productoId, ...whereComercialActivo },
  });
}

export async function comprometerStockComercialRepositorio(productoId, cantidad) {
  return prisma.$transaction(async (tx) => {
    const producto = await obtenerProductoTx(tx, productoId);
    if (!producto) {
      return { ok: false, motivo: 'PRODUCTO_NO_DISPONIBLE' };
    }
    const disponible = calcularStockDisponible(producto);
    if (disponible < cantidad) {
      return {
        ok: false,
        motivo: 'STOCK_INSUFICIENTE',
        stockDisponible: disponible,
        stockFisico: producto.stockUnidades,
        stockComprometido: producto.stockComprometidoUnidades ?? 0,
        solicitado: cantidad,
      };
    }
    await tx.productos.update({
      where: { id: productoId },
      data: {
        stockComprometidoUnidades: (producto.stockComprometidoUnidades ?? 0) + cantidad,
      },
    });
    return { ok: true, stockDisponibleRestante: disponible - cantidad };
  });
}

/** Entrega confirmada: baja físico y libera compromiso. */
export async function confirmarEntregaStockRepositorio(productoId, cantidad) {
  return prisma.$transaction(async (tx) => {
    const producto = await obtenerProductoTx(tx, productoId);
    if (!producto) {
      return { ok: false, motivo: 'PRODUCTO_NO_DISPONIBLE' };
    }
    const comprometido = producto.stockComprometidoUnidades ?? 0;
    if (comprometido < cantidad) {
      return { ok: false, motivo: 'COMPROMISO_INSUFICIENTE', comprometido, solicitado: cantidad };
    }
    if (producto.stockUnidades < cantidad) {
      return { ok: false, motivo: 'STOCK_FISICO_INSUFICIENTE' };
    }
    await tx.productos.update({
      where: { id: productoId },
      data: {
        stockUnidades: producto.stockUnidades - cantidad,
        stockComprometidoUnidades: comprometido - cantidad,
      },
    });
    return { ok: true };
  });
}

/** Pedido cancelado: solo libera compromiso. */
export async function liberarCompromisoStockRepositorio(productoId, cantidad) {
  return prisma.$transaction(async (tx) => {
    const producto = await obtenerProductoTx(tx, productoId);
    if (!producto) {
      return { ok: false, motivo: 'PRODUCTO_NO_DISPONIBLE' };
    }
    const comprometido = producto.stockComprometidoUnidades ?? 0;
    const liberar = Math.min(cantidad, comprometido);
    await tx.productos.update({
      where: { id: productoId },
      data: {
        stockComprometidoUnidades: Math.max(0, comprometido - liberar),
      },
    });
    return { ok: true, unidadesLiberadas: liberar };
  });
}

/** Modo legacy: descuenta stock físico al cerrar (sin compromiso). */
export async function descontarStockFisicoRepositorio(productoId, cantidad) {
  return prisma.$transaction(async (tx) => {
    const producto = await obtenerProductoTx(tx, productoId);
    if (!producto) {
      return { ok: false, motivo: 'PRODUCTO_NO_DISPONIBLE' };
    }
    if (producto.stockUnidades < cantidad) {
      return {
        ok: false,
        motivo: 'STOCK_INSUFICIENTE',
        stockActual: producto.stockUnidades,
        solicitado: cantidad,
      };
    }
    await tx.productos.update({
      where: { id: productoId },
      data: { stockUnidades: producto.stockUnidades - cantidad },
    });
    return { ok: true };
  });
}
