import { ratioSimilitud } from '../busqueda/similitudTexto.js';

function normalizarNombre(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function productoCoincideLineaPedido(producto, search) {
  const n = normalizarNombre(producto.nombre ?? '');
  const q = normalizarNombre(search);
  if (!n || !q) {
    return false;
  }
  if (n.includes(q) || q.includes(n)) {
    return true;
  }
  if (ratioSimilitud(q, n) >= 0.72) {
    return true;
  }
  const tokens = q.split(' ').filter((w) => w.length > 2);
  if (tokens.length === 0) {
    return false;
  }
  const hits = tokens.filter((w) => n.includes(w)).length;
  return hits >= Math.min(2, tokens.length);
}

function candidatosProductos(estado, resultadosTools) {
  const map = new Map();
  for (const p of estado.productosEnContexto ?? []) {
    if (p?.id) {
      map.set(p.id, p);
    }
  }
  for (const r of resultadosTools.filter((x) => x.tool === 'buscarProductos')) {
    for (const p of r.result?.productos ?? []) {
      map.set(p.id, p);
    }
  }
  for (const r of resultadosTools.filter((x) => x.tool === 'consultarPrecio' && x.result?.encontrado)) {
    map.set(r.result.productoId, {
      id: r.result.productoId,
      nombre: r.result.nombre,
    });
  }
  return [...map.values()];
}

/**
 * Resuelve ítems `{ productoId, cantidad }` desde borrador, carrito o búsquedas del turno.
 */
export function resolverItemsParaPresupuesto(estado, resultadosTools = []) {
  const directos = estado.pedidoBorrador?.items ?? [];
  if (directos.length) {
    return directos.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
  }

  const pendientes = estado.pedidoBorrador?.itemsPendientes ?? [];
  const productos = candidatosProductos(estado, resultadosTools);
  if (pendientes.length && productos.length) {
    const items = [];
    for (const linea of pendientes) {
      const prod =
        productos.find((p) => productoCoincideLineaPedido(p, linea.search)) ??
        productos.find((p) => p.id === linea.productoId);
      if (prod?.id) {
        items.push({ productoId: prod.id, cantidad: linea.cantidad });
      }
    }
    if (items.length) {
      return items;
    }
  }

  const carrito = estado.carritoSesion ?? [];
  if (carrito.length) {
    return carrito.map((c) => ({ productoId: c.productoId, cantidad: c.cantidad }));
  }

  return [];
}

export function agregarLineasAlCarritoSesion(estado, lineas = []) {
  const prev = [...(estado.carritoSesion ?? [])];
  for (const linea of lineas) {
    if (!linea?.productoId && !linea?.search) {
      continue;
    }
    const cantidad = linea.cantidad > 0 ? linea.cantidad : 1;
    if (linea.productoId) {
      const idx = prev.findIndex((x) => x.productoId === linea.productoId);
      if (idx >= 0) {
        prev[idx] = { ...prev[idx], cantidad: prev[idx].cantidad + cantidad };
      } else {
        prev.push({
          productoId: linea.productoId,
          nombre: linea.nombre ?? null,
          cantidad,
        });
      }
    }
  }
  return { ...estado, carritoSesion: prev.slice(-12) };
}
