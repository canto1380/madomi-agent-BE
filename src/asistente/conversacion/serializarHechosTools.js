/**
 * Resume resultados de tools para el LLM (sin volcar JSON enorme).
 */
export function serializarHechosParaLlm({ resultadosTools = [], estado = {}, intencion = null, borrador = '' }) {
  const hechos = {
    intencionDetectada: intencion ?? estado.intencionActual ?? null,
    contextoConversacion: {
      productoActual: estado.productoActual ?? null,
      productosMostrados: (estado.productosMostrados ?? []).slice(0, 12).map((p, i) => ({
        indice: i + 1,
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria ?? null,
      })),
      presupuestoIdActivo: estado.presupuestoIdActivo ?? null,
    },
    tools: [],
    borradorInterno: borrador?.slice(0, 2000) || null,
  };

  for (const { tool, result } of resultadosTools) {
    if (!result) {
      hechos.tools.push({ tool, ok: false });
      continue;
    }
    const ok = result.ok !== false;
    const entry = { tool, ok };

    if (tool === 'buscarProductos') {
      entry.productos = (result.productos ?? []).slice(0, 15).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        descripcion: p.descripcion?.slice?.(0, 120) ?? p.descripcion,
      }));
      entry.total = result.productos?.length ?? 0;
    } else if (tool === 'consultarPrecio') {
      entry.productoId = result.productoId;
      entry.nombre = result.nombre;
      entry.precioUnitario = result.precioUnitario;
      entry.moneda = result.moneda;
      entry.tipoCliente = result.tipoCliente;
    } else if (tool === 'consultarStock') {
      entry.productoId = result.productoId;
      entry.disponible = result.disponible;
      entry.unidades = result.unidades;
    } else if (tool === 'buscarPoliticas' || tool === 'consultarEnvio') {
      const chunks =
        result.chunks ??
        result.politicas?.chunks ??
        result.fragmentos ??
        [];
      entry.fragmentos = chunks
        .slice(0, 4)
        .map((c) => {
          const raw = typeof c === 'string' ? c : c.texto ?? c.content ?? '';
          return raw.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').slice(0, 320);
        });
    } else if (tool === 'actualizarLead') {
      entry.leadId = result.leadId;
      entry.datosCapturados = result.datosCapturados;
    } else if (tool === 'calcularPresupuesto' || tool === 'generarPresupuestoPdf') {
      entry.presupuestoId = result.presupuestoId;
      entry.total = result.total;
      entry.lineas = result.lineas?.slice?.(0, 10);
    } else if (tool === 'cerrarVenta') {
      entry.pedidoId = result.pedidoId;
    } else {
      entry.resumen = JSON.stringify(result).slice(0, 800);
    }

    hechos.tools.push(entry);
  }

  return JSON.stringify(hechos, null, 2);
}
