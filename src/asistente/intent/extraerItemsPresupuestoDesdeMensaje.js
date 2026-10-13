/**
 * Líneas tipo "Humita - 20 unidades" o "Bondiola desmechada - 10 un".
 * @returns {{ search: string, cantidad: number }[]}
 */
export function extraerLineasPedidoPorNombre(mensaje) {
  const lineas = [];
  const texto = mensaje.trim();
  if (!texto) {
    return lineas;
  }

  const bloques = texto.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const patron =
    /^(.{2,80}?)\s*(?:[-–—:]+\s*|\s*:\s*)(\d+(?:[.,]\d+)?)\s*(unidades?|un\.?\b|u\.?\b|kg|cajas?)?\s*$/i;

  for (const bloque of bloques) {
    const m = bloque.match(patron);
    if (!m) {
      continue;
    }
    const search = m[1].trim();
    const cantidad = Number(String(m[2]).replace(',', '.'));
    if (!search || !Number.isFinite(cantidad) || cantidad <= 0) {
      continue;
    }
    lineas.push({ search, cantidad });
  }

  return lineas;
}

export function mensajePidePresupuestoExplicito(mensaje) {
  const m = mensaje.toLowerCase();
  return (
    /presupuesto|cotizaci[oó]n|arm[aá]rme|arm[aá]me|mand[aá]me|envi[aá]me|pasame el presupuesto|haceme el presupuesto/.test(
      m,
    ) ||
    (/arm[aá]|gener[aá]|hac[eé]/.test(m) && /presupuesto/.test(m)) ||
    /no me mandaste|no me enviaste|falta el presupuesto|donde est[aá] el presupuesto/.test(m)
  );
}
