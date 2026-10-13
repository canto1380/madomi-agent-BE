/**
 * Similitud para nombres de producto en chat (typos, plurales).
 */

export function distanciaLevenshtein(a, b) {
  const s = a ?? '';
  const t = b ?? '';
  const m = s.length;
  const n = t.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j += 1) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function ratioSimilitud(a, b) {
  if (!a || !b) {
    return 0;
  }
  const x = String(a).toLowerCase().trim();
  const y = String(b).toLowerCase().trim();
  if (x === y) {
    return 1;
  }
  if (x.includes(y) || y.includes(x)) {
    return 0.92;
  }
  const d = distanciaLevenshtein(x, y);
  const maxLen = Math.max(x.length, y.length);
  return maxLen === 0 ? 0 : 1 - d / maxLen;
}

/** Variantes de un término (plural/singular simple). */
export function variantesTerminoBusqueda(term) {
  const t = term.trim().toLowerCase();
  if (!t || t.length < 3) {
    return [t].filter(Boolean);
  }
  const set = new Set([t]);
  if (t.endsWith('as') && t.length > 4) {
    set.add(t.slice(0, -1));
    set.add(t.slice(0, -2));
  } else if (t.endsWith('es') && t.length > 4) {
    set.add(t.slice(0, -2));
    set.add(t.slice(0, -1));
  } else if (t.endsWith('s') && t.length > 3) {
    set.add(t.slice(0, -1));
  } else {
    set.add(`${t}s`);
    set.add(`${t}as`);
  }
  return [...set].filter((v) => v.length >= 2);
}

const UMBRAL_FUZZY = 0.72;
const UMBRAL_FUZZY_SUAVE = 0.62;

function palabrasDe(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2);
}

function mejorMatchPalabraEnPalabras(palabra, palabrasProducto) {
  let best = 0;
  for (const p of palabrasProducto) {
    if (p.includes(palabra) || palabra.includes(p)) {
      const sub = Math.min(palabra.length, p.length) / Math.max(palabra.length, p.length);
      best = Math.max(best, 0.82 + sub * 0.1);
      continue;
    }
    best = Math.max(best, ratioSimilitud(palabra, p));
  }
  return best;
}

export function puntuarProductoContraConsulta(producto, consultaNormalizada, tokens) {
  const nombre = (producto.nombre ?? '').toLowerCase();
  const categoria = (producto.categoria ?? '').toLowerCase();
  const descripcion = (producto.descripcion ?? '').toLowerCase();
  const id = (producto.id ?? '').toLowerCase();
  const blob = `${nombre} ${categoria} ${descripcion} ${id}`;
  const palabrasNombre = palabrasDe(producto.nombre);
  const palabrasCategoria = palabrasDe(producto.categoria);

  let score = 0;

  const simConsultaNombre = ratioSimilitud(consultaNormalizada, nombre);
  if (simConsultaNombre >= UMBRAL_FUZZY) {
    score += Math.round(simConsultaNombre * 10);
  }

  const simConsultaCat = ratioSimilitud(consultaNormalizada, categoria);
  if (simConsultaCat >= UMBRAL_FUZZY) {
    score += Math.round(simConsultaCat * 6);
  }

  for (const rawToken of tokens) {
    let mejorToken = 0;
    for (const token of variantesTerminoBusqueda(rawToken)) {
      if (token.length < 2) {
        continue;
      }
      if (blob.includes(token)) {
        mejorToken = Math.max(mejorToken, 4);
      }
      const simNomPal = mejorMatchPalabraEnPalabras(token, palabrasNombre);
      const simCatPal = mejorMatchPalabraEnPalabras(token, palabrasCategoria);
      const simPal = Math.max(simNomPal, simCatPal * 0.85);
      if (simPal >= UMBRAL_FUZZY) {
        mejorToken = Math.max(mejorToken, Math.round(simPal * 6));
      } else if (simPal >= UMBRAL_FUZZY_SUAVE) {
        mejorToken = Math.max(mejorToken, 3);
      }
      const simNom = ratioSimilitud(token, nombre);
      const simCat = ratioSimilitud(token, categoria);
      const best = Math.max(simNom, simCat);
      if (best >= UMBRAL_FUZZY) {
        mejorToken = Math.max(mejorToken, Math.round(best * 5));
      } else if (best >= UMBRAL_FUZZY_SUAVE) {
        mejorToken = Math.max(mejorToken, 2);
      }
    }
    score += mejorToken;
  }

  if (tokens.length >= 2 && score > 0) {
    score += 2;
  }

  return score;
}

export function rankearProductosPorSimilitud(productos, consulta, { limit = 15 } = {}) {
  const consultaNormalizada = consulta.trim().toLowerCase();
  const tokens = consultaNormalizada.split(/\s+/).filter((t) => t.length >= 2);

  return productos
    .map((p) => ({
      producto: p,
      score: puntuarProductoContraConsulta(p, consultaNormalizada, tokens),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.producto);
}
