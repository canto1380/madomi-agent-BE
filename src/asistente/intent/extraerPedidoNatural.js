/**
 * Cantidades en lenguaje natural: "10 unidades de bondiola y 15 de guiso de lenteja"
 * @returns {{ search: string, cantidad: number }[]}
 */
export function extraerPedidoNaturalDesdeMensaje(mensaje) {
  const items = [];
  const texto = mensaje.trim();
  if (!texto) {
    return items;
  }

  const patrones = [
    /(\d+(?:[.,]\d+)?)\s*(?:unidades?|un\.?\b|u\.?\b)\s*(?:de\s+)?(.{2,80}?)(?=\s+(?:y|e)\s+|\s*\.|$)/gi,
    /necesito\s+(\d+(?:[.,]\d+)?)\s*(?:unidades?|un\.?\b|u\.?\b)\s*(?:de\s+)?(.{2,80}?)(?=\s+(?:y|e)\s+|\s*\.|$)/gi,
    /(?:y\s+)?(\d+(?:[.,]\d+)?)\s*(?:de\s+)(.{2,80}?)(?=\s*\.|$)/gi,
  ];

  const seen = new Set();
  for (const re of patrones) {
    for (const m of texto.matchAll(re)) {
      const cantidad = Number(String(m[1]).replace(',', '.'));
      let search = m[2].replace(/[?.!]+$/, '').trim();
      search = search.replace(/^(?:del|de la|de el|de los|de las|la|el|los|las)\s+/i, '').trim();
      if (!search || !Number.isFinite(cantidad) || cantidad <= 0) {
        continue;
      }
      const key = `${search.toLowerCase()}|${cantidad}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      items.push({ search, cantidad });
    }
  }

  return items.slice(0, 8);
}
