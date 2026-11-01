export function esSaludoPuro(mensaje) {
  const t = String(mensaje ?? '')
    .trim()
    .toLowerCase()
    .replace(/[!?.¡¿]+/g, '')
    .trim();
  if (t.length > 40) {
    return false;
  }
  return /^(hola|buenas|buen\s*d[ií]a|hey|buen\s*tarde|buenas\s*tardes|buenas\s*noches)$/.test(t);
}

export function respuestaSaludoRapido(empresaNombre) {
  return `¡Hola! 👋 ¿Cómo estás? Soy el asistente de ${empresaNombre}. ¿En qué puedo ayudarte hoy?`;
}
