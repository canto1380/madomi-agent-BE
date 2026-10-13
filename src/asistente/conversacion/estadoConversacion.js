/** Estado de dialogo persistido en `conversacion.metadata.contextoChat`. */

export function estadoConversacionVacio() {
  return {
    intencionActual: null,
    ultimoTema: null,
    productoActual: null,
    ultimosProductosMostrados: [],
    esperandoAccion: null,
    zonaEnvio: null,
    presupuestoIdActivo: null,
    pedidoBorrador: { items: [], itemsPendientes: [] },
    ultimaBusquedaTexto: null,
    ultimosProductosConsultados: [],
    productosEnContexto: [],
    carritoSesion: [],
  };
}

export function normalizarEstadoConversacion(raw) {
  const base = estadoConversacionVacio();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  return {
    ...base,
    ...raw,
    ultimosProductosMostrados: Array.isArray(raw.ultimosProductosMostrados)
      ? raw.ultimosProductosMostrados
      : [],
    pedidoBorrador:
      raw.pedidoBorrador && typeof raw.pedidoBorrador === 'object'
        ? {
            items: raw.pedidoBorrador.items ?? [],
            itemsPendientes: raw.pedidoBorrador.itemsPendientes ?? [],
          }
        : base.pedidoBorrador,
    ultimosProductosConsultados: Array.isArray(raw.ultimosProductosConsultados)
      ? raw.ultimosProductosConsultados
      : [],
    productosEnContexto: Array.isArray(raw.productosEnContexto) ? raw.productosEnContexto : [],
    carritoSesion: Array.isArray(raw.carritoSesion) ? raw.carritoSesion : [],
  };
}

function dedupeProductosContexto(lista) {
  const map = new Map();
  for (const p of lista ?? []) {
    if (p?.id) {
      map.set(p.id, {
        id: p.id,
        nombre: p.nombre ?? p.id,
        categoria: p.categoria ?? null,
      });
    }
  }
  return [...map.values()];
}

export function agregarProductosAlContextoSesion(estado, productos) {
  const merged = dedupeProductosContexto([
    ...(estado.productosEnContexto ?? []),
    ...(productos ?? []).map((p) => ({
      id: p.id ?? p.productoId,
      nombre: p.nombre,
      categoria: p.categoria ?? p.categoriaSnapshot ?? null,
    })),
  ]);
  return {
    ...estado,
    productosEnContexto: merged.slice(-12),
  };
}

export function registrarProductosConsultados(estado, productosPrecio) {
  const entradas = (productosPrecio ?? []).map((p) => ({
    id: p.productoId ?? p.id,
    nombre: p.nombre,
    categoria: p.categoria ?? null,
  }));
  if (!entradas.length) {
    return estado;
  }
  const merged = dedupeProductosContexto([
    ...(estado.ultimosProductosConsultados ?? []),
    ...entradas,
  ]);
  let next = {
    ...estado,
    ultimosProductosConsultados: merged.slice(-8),
  };
  next = agregarProductosAlContextoSesion(next, entradas);
  return next;
}

export function registrarProductosMostrados(estado, productos) {
  const lista = (productos ?? []).slice(0, 8).map((p, i) => ({
    indice: i + 1,
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria ?? null,
  }));
  let next = {
    ...estado,
    ultimosProductosMostrados: lista,
    productoActual: lista[0] ?? estado.productoActual,
    ultimoTema: 'productos',
  };
  next = agregarProductosAlContextoSesion(next, lista);
  return next;
}

export function productoPorReferencia(estado, ref) {
  const lista = estado.ultimosProductosMostrados ?? [];
  if (!lista.length) {
    return null;
  }
  const r = ref.toLowerCase();
  const ordinales = {
    primero: 1,
    primera: 1,
    uno: 1,
    '1': 1,
    segundo: 2,
    segunda: 2,
    dos: 2,
    '2': 2,
    tercero: 3,
    tercera: 3,
    tres: 3,
    '3': 3,
    cuarto: 4,
    cuarta: 4,
    cuatro: 4,
    '4': 4,
  };
  for (const [palabra, n] of Object.entries(ordinales)) {
    if (r.includes(palabra)) {
      return lista.find((p) => p.indice === n) ?? null;
    }
  }
  const num = r.match(/\b(\d)\b/);
  if (num) {
    return lista.find((p) => p.indice === Number(num[1])) ?? null;
  }
  return null;
}
