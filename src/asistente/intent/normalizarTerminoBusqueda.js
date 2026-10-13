/**
 * Normalización mínima del texto de búsqueda (sin sinónimos por producto).
 * La tolerancia a typos y nombres parecidos la resuelve similitudTexto + Postgres.
 */
export function normalizarTerminoBusqueda(search) {
  if (!search?.trim()) {
    return search;
  }
  return search.trim().replace(/\s+/g, ' ');
}
