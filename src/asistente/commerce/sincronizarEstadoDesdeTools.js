import {
  registrarProductosConsultados,
  registrarProductosMostrados,
} from '../conversacion/estadoConversacion.js';
import { agregarLineasAlCarritoSesion } from '../presupuesto/resolverItemsPresupuesto.js';
import { presupuestoIdFromTools } from './extraerIdsComerciales.js';

function uniqProductosDesdeResultados(resultadosTools) {
  const map = new Map();
  for (const r of resultadosTools.filter((x) => x.tool === 'buscarProductos')) {
    for (const p of r.result?.productos ?? []) {
      map.set(p.id, p);
    }
  }
  return [...map.values()];
}

/**
 * Actualiza `contextoChat` a partir de tools ejecutadas en el turno (sin reglas NLU).
 */
export function sincronizarEstadoDesdeTools(estado, resultadosTools, leadDatos) {
  let next = { ...estado };

  for (const r of resultadosTools) {
    if (r.tool === 'actualizarLead' && r.result?.ok) {
      if (leadDatos?.localidad) {
        next = { ...next, zonaEnvio: leadDatos.localidad, esperandoAccion: null };
      }
    }
    if (r.tool === 'calcularPresupuesto' && r.result?.ok) {
      const items = r.result.items ?? r.result.lineas?.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
      }));
      if (items?.length) {
        next = {
          ...next,
          pedidoBorrador: { items, itemsPendientes: [] },
          presupuestoIdActivo: r.result.presupuestoId ? String(r.result.presupuestoId) : next.presupuestoIdActivo,
          ultimoTema: 'presupuesto',
          esperandoAccion: leadDatos?.localidad ? null : 'localidad_para_presupuesto',
        };
        next = agregarLineasAlCarritoSesion(
          next,
          items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        );
      }
    }
  }

  const productos = uniqProductosDesdeResultados(resultadosTools);
  if (productos.length) {
    next = registrarProductosMostrados(next, productos);
  }

  const preciosOk = resultadosTools
    .filter((r) => r.tool === 'consultarPrecio' && r.result?.encontrado)
    .map((r) => r.result);
  if (preciosOk.length) {
    next = registrarProductosConsultados(next, preciosOk);
  }

  const pid = presupuestoIdFromTools(resultadosTools);
  if (pid) {
    next = { ...next, presupuestoIdActivo: String(pid) };
  }

  if (leadDatos?.localidad && !next.zonaEnvio) {
    next = { ...next, zonaEnvio: leadDatos.localidad };
  }

  return next;
}
