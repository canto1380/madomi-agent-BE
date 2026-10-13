import { extraerFrasesProducto } from '../intent/extraerFrasesProducto.js';

export function mensajeReferenciaContextoSesion(mensaje) {
  const m = mensaje.toLowerCase();
  return (
    /\b(esos|estos|esas|estas|los mismos|las mismas|de esos|de esas|esos productos|estos productos)\b/.test(
      m,
    ) || /\b(lo[s']?\s+nuevo[s]?|productos?\s+nuevo[s]?)\b/.test(m)
  );
}

function dedupeProductos(lista) {
  const map = new Map();
  for (const p of lista ?? []) {
    if (p?.id) {
      map.set(p.id, { id: p.id, nombre: p.nombre ?? p.id, categoria: p.categoria ?? null });
    }
  }
  return [...map.values()];
}

export function productosEnSesion(estado) {
  if (estado.productosEnContexto?.length) {
    return estado.productosEnContexto;
  }
  return dedupeProductos([
    ...(estado.ultimosProductosConsultados ?? []),
    ...(estado.ultimosProductosMostrados ?? []),
  ]);
}

/** Frases "bondiola" / "guiso de lenteja" tras mencionar mayorista. */
export function extraerProductosNombradosMayorista(mensaje) {
  const t = mensaje.trim();
  if (!/mayorista|por mayor|al por mayor/.test(t.toLowerCase())) {
    return [];
  }
  let body = t.replace(/^[\s\S]*?(?:mayorista|por mayor|al por mayor)\s*/i, '');
  body = body.replace(/^(?:de|del|la|el|los|las)\s+/i, '').replace(/\?.*$/, '').trim();
  if (!body || mensajeReferenciaContextoSesion(t)) {
    return [];
  }
  const partes = body
    .split(/\s+(?:y|e)\s+/i)
    .map((p) =>
      p
        .replace(/^(?:del|de la|de el|de los|de las|la|el|los|las)\s+/i, '')
        .replace(/[?.!]+$/, '')
        .trim(),
    )
    .filter((p) => p.length >= 3 && !/^(cual|cu[aá]l|ser[ií]a|seria|precio)$/.test(p.toLowerCase()));

  if (partes.length) {
    return partes.slice(0, 6);
  }
  const frases = extraerFrasesProducto(t);
  return frases.filter((f) => f.length >= 3 && !mensajeReferenciaContextoSesion(f)).slice(0, 6);
}

/**
 * Productos a consultar (ids conocidos o búsquedas pendientes).
 * @returns {{ refs: { id, nombre }[], buscar: string[] }}
 */
export function resolverProductosParaMayorista(mensaje, estado) {
  const nombrados = extraerProductosNombradosMayorista(mensaje);
  if (nombrados.length) {
    return { refs: [], buscar: nombrados };
  }

  if (mensajeReferenciaContextoSesion(mensaje) || /\besos\b|\bestos\b/.test(mensaje.toLowerCase())) {
    const refs = productosEnSesion(estado);
    if (refs.length) {
      return { refs, buscar: [] };
    }
  }

  const sesion = productosEnSesion(estado);
  if (sesion.length) {
    return { refs: sesion, buscar: [] };
  }

  return { refs: [], buscar: [] };
}
