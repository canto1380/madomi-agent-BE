import { listarProductosComercialesRepositorio } from '../../repositories/productos.repository.js';
import { normalizarTerminoBusqueda } from '../intent/normalizarTerminoBusqueda.js';

/**
 * Búsqueda comercial en Postgres (contains + fuzzy en repositorio).
 * Catálogo = lo que haya en CMS con activoComercial; el LLM reintenta search si hace falta.
 */
export async function buscarProductosComercial({
  search,
  categoria,
  limit = 20,
  ids,
  listarCatalogo,
  novedades,
  idsNovedades,
}) {
  const consultaOriginal = search?.trim() || null;
  const consultaNormalizada = consultaOriginal ? normalizarTerminoBusqueda(consultaOriginal) : null;

  const rows = await listarProductosComercialesRepositorio({
    search: listarCatalogo || novedades ? undefined : consultaNormalizada ?? search,
    categoria,
    limit: novedades ? Math.max(idsNovedades?.length ?? 0, 1) : limit,
    ids: idsNovedades ?? ids,
  });

  return {
    rows,
    consultaOriginal,
    consultaNormalizada,
  };
}
