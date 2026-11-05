/**
 * Validación determinista (~10 % Opción A): montos y stock vs resultados de tools del turno.
 */

function redondearMonto(n) {
  return Math.round(Number(n) * 100) / 100;
}

function parseMontoArs(fragmento) {
  const limpio = String(fragmento).replace(/\./g, '').replace(',', '.');
  const n = Number(limpio);
  return Number.isFinite(n) ? redondearMonto(n) : null;
}

/** @returns {number[]} montos numéricos citados como ARS en el texto */
export function extraerMontosArsEnTexto(texto) {
  if (!texto?.trim()) {
    return [];
  }
  const montos = [];
  const patrones = [
    /\$\s*([\d]{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g,
    /([\d]{1,3}(?:\.\d{3})+|\d+)\s*ars\b/gi,
  ];
  for (const re of patrones) {
    let m;
    while ((m = re.exec(texto)) !== null) {
      const val = parseMontoArs(m[1]);
      if (val != null && val > 0) {
        montos.push(val);
      }
    }
  }
  return [...new Set(montos)];
}

function recopilarHechosComerciales(resultadosTools) {
  const montos = new Set();
  const lineasPrecio = [];
  const stocks = [];

  for (const r of resultadosTools ?? []) {
    if (r.tool === 'consultarPrecio' && r.result?.encontrado) {
      const p = r.result.precioFinal;
      if (p != null) {
        const v = redondearMonto(p);
        montos.add(v);
        lineasPrecio.push(`${r.result.nombre}: $${v} ARS`);
      }
    }
    if (r.tool === 'calcularPresupuesto' && r.result?.ok) {
      if (r.result.total != null) {
        montos.add(redondearMonto(r.result.total));
      }
      for (const i of r.result.items ?? []) {
        if (i.subtotalLinea != null) {
          montos.add(redondearMonto(i.subtotalLinea));
        }
        if (i.precioUnitarioSnapshot != null) {
          montos.add(redondearMonto(i.precioUnitarioSnapshot));
        }
      }
      lineasPrecio.push(`Total presupuesto: $${redondearMonto(r.result.total)} ARS`);
    }
    if (r.tool === 'consultarStock' && r.result?.encontrado) {
      stocks.push({
        nombre: r.result.nombre,
        disponible: Boolean(r.result.disponible),
        stockDisponible: r.result.stockDisponible,
      });
    }
  }

  return { montos, lineasPrecio, stocks };
}

function montoAutorizado(val, autorizados) {
  for (const a of autorizados) {
    if (Math.abs(a - val) < 0.02) {
      return true;
    }
  }
  return false;
}

function textoNiegaStock(texto) {
  return /\b(sin stock|no hay stock|figura sin stock|no tenemos stock|agotad)/i.test(texto);
}

function textoAfirmaStock(texto) {
  return /\b(hay stock|con stock|tenemos stock|disponible|hay unidades)/i.test(texto);
}

function respuestaYaCitaMontosAutorizados(texto, autorizados) {
  if (!autorizados?.size) {
    return true;
  }
  const citados = extraerMontosArsEnTexto(texto);
  return [...autorizados].every((a) => citados.some((c) => Math.abs(c - a) < 0.02));
}

function textoYaTieneBloqueVerificado(texto) {
  return /\b(dato verificado|verifico stock|según el sistema)/i.test(texto);
}

/**
 * Ajusta la respuesta si cita montos no respaldados por tools o contradice stock verificado.
 */
export function aplicarValidacionComercialRespuesta(texto, resultadosTools) {
  let out = texto?.trim() ?? '';
  if (!out) {
    return out;
  }

  const { montos: autorizados, lineasPrecio, stocks } = recopilarHechosComerciales(resultadosTools);

  const citados = extraerMontosArsEnTexto(out);
  const ilegales = citados.filter((c) => !montoAutorizado(c, autorizados));

  if (autorizados.size > 0 && ilegales.length > 0) {
    for (const bad of ilegales) {
      const re = new RegExp(
        `\\$\\s*${String(bad).replace('.', '\\.')}([\\.,]\\d{1,2})?|\\b${String(bad).replace('.', '\\.')}\\b`,
        'g',
      );
      out = out.replace(re, '').replace(/\s{2,}/g, ' ').trim();
    }
    const faltaDato =
      lineasPrecio.length &&
      !respuestaYaCitaMontosAutorizados(out, autorizados) &&
      !textoYaTieneBloqueVerificado(out);
    if (faltaDato) {
      out = `${out}\n\nDato verificado en el sistema: ${lineasPrecio.join('; ')}.`;
    }
  }

  const conStock = stocks.filter((s) => s.disponible);
  const sinStock = stocks.filter((s) => !s.disponible);

  if (
    conStock.length &&
    textoNiegaStock(out) &&
    !textoAfirmaStock(out) &&
    !textoYaTieneBloqueVerificado(out)
  ) {
    const nombres = conStock.map((s) => s.nombre).join(', ');
    out = `${out}\n\n(Ahora verifico stock: ${nombres} sí tiene disponibilidad según el sistema.)`;
  } else if (
    sinStock.length &&
    textoAfirmaStock(out) &&
    !textoNiegaStock(out) &&
    !textoYaTieneBloqueVerificado(out)
  ) {
    const nombres = sinStock.map((s) => s.nombre).join(', ');
    out = `${out}\n\n(Stock: ${nombres} figura sin unidades disponibles por ahora.)`;
  }

  return out.trim();
}
