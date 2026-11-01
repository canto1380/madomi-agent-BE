/**
 * Cuando Cursor no devuelve JSON válido pero sí texto útil para el cliente.
 */
export function extraerTextoRespuestaDesdeSalidaModelo(texto) {
  if (!texto?.trim()) {
    return null;
  }

  const t = texto.trim();

  const matchJsonTexto = t.match(/"texto"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  if (matchJsonTexto) {
    try {
      return JSON.parse(`"${matchJsonTexto[1]}"`);
    } catch {
      /* seguir */
    }
  }

  const sinFence = t.replace(/```[\s\S]*?```/g, '').trim();
  const sinJson = sinFence.replace(/\{[\s\S]*\}/g, '').trim();

  if (sinJson.length >= 24 && /[a-záéíóúñ]/i.test(sinJson)) {
    return sinJson;
  }

  if (!t.includes('{') && t.length >= 12) {
    return t;
  }

  return null;
}
