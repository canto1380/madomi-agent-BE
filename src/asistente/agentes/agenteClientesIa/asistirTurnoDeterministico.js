/**
 * @deprecated Opción A (P0): el runtime ya no usa atajos que redactan al cliente.
 * Toda respuesta comercial pasa por el LLM en `run.js` + tools.
 * Este archivo se mantiene vacío de lógica para evitar reintroducir plantillas por accidente.
 */

/** @deprecated Siempre null — usar loop LLM. */
export function resolverAsistenciaTurnoDeterministico() {
  return null;
}
