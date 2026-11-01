/**
 * El widget de chat muestra texto plano; el modelo suele devolver markdown (**negrita**, etc.).
 */
export function normalizarTextoRespuestaChat(texto) {
  if (!texto?.trim()) {
    return texto ?? '';
  }

  let t = texto;

  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/\*([^*\n]+)\*/g, '$1');
  t = t.replace(/_([^_\n]+)_/g, '$1');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/`([^`]+)`/g, '$1');

  return t.trim();
}
