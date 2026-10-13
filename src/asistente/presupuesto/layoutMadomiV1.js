/**
 * Layout programático calibrado al modelo `plantilla-presupuesto.png` (referencia visual, no se embebe en el PDF).
 * Coordenadas en puntos PDF (A4: 595.28 × 841.89). Origen arriba-izquierda.
 */
export const COLORES_MADOMI_PDF = {
  texto: '#2b2b2b',
  textoClaro: '#5c5c5c',
  acento: '#e8bc2a',
  tablaHeader: '#3d3d3d',
  tablaHeaderTexto: '#ffffff',
  filaZebra: '#f3f3f3',
  totalBar: '#3d3d3d',
  pieAmarillo: '#e8bc2a',
  pieGris: '#3d3d3d',
};

/** Escala PNG (1414×2000) → A4 en puntos (~0,421). */
const M = 595.28 / 1414;

export const LAYOUT_MADOMI_V1 = {
  page: { width: 595.28, height: 841.89, margin: Math.round(141 * M) },

  logo: { x: Math.round(141 * M), y: Math.round(85 * M), maxWidth: 130, maxHeight: 72 },

  titulo: { x: 547, y: Math.round(105 * M), fontSize: 26, label: 'PRESUPUESTO' },
  numero: { x: 547, y: Math.round(165 * M), fontSize: 11 },

  cliente: {
    labelY: Math.round(328 * M),
    nombreY: Math.round(352 * M),
    subtituloY: Math.round(378 * M),
    x: Math.round(141 * M),
    label: 'CLIENTE',
  },

  fechas: {
    x: 547,
    yInicio: Math.round(328 * M),
    lineHeight: 16,
    fontSize: 10,
  },

  bloquesMedio: {
    y: Math.round(503 * M),
    contactoX: Math.round(141 * M),
    pagoX: 547,
    labelFontSize: 9,
    bodyFontSize: 10,
    lineHeight: 14,
  },

  tabla: {
    x: Math.round(141 * M),
    y: Math.round(674 * M),
    width: Math.round((1271 - 141) * M),
    headerHeight: 22,
    rowHeight: 22,
    cols: {
      num: { x: 0, w: Math.round(66 * M), align: 'center' },
      desc: { x: Math.round(66 * M), w: Math.round(520 * M), align: 'left' },
      precio: { x: Math.round(586 * M), w: Math.round(152 * M), align: 'right' },
      cant: { x: Math.round(738 * M), w: Math.round(118 * M), align: 'center' },
      total: { x: Math.round(856 * M), w: Math.round(274 * M), align: 'right' },
    },
    headers: ['#', 'DESCRIPCIÓN', 'PRECIO', 'CANTIDAD', 'TOTAL'],
  },

  totales: {
    x: Math.round(141 * M) + Math.round(738 * M),
    width: Math.round(274 * M) + Math.round(118 * M),
    labelFontSize: 10,
    valueFontSize: 10,
    totalBarHeight: Math.round(34 * M),
  },

  legales: {
    x: Math.round(141 * M),
    y: Math.round(1267 * M),
    width: 300,
    labelFontSize: 9,
    bodyFontSize: 9,
    lineHeight: 12,
    bloqueGap: Math.round(1448 * M) - Math.round(1267 * M),
  },

  pie: {
    contactoY: Math.round(1767 * M),
    contactoX: 547,
    webBarY: Math.round(1830 * M),
    webBarHeight: Math.round(57 * M),
    grisBarY: Math.round(1937 * M),
    grisBarHeight: Math.round(63 * M),
  },
};

/** Aplica overrides desde PRESUPUESTO_PDF_LAYOUT (JSON parcial). */
export function mergeLayoutMadomiV1(overrides = {}) {
  if (!overrides || typeof overrides !== 'object') {
    return LAYOUT_MADOMI_V1;
  }
  return deepMerge(JSON.parse(JSON.stringify(LAYOUT_MADOMI_V1)), overrides);
}

function deepMerge(base, patch) {
  for (const key of Object.keys(patch)) {
    if (
      patch[key] &&
      typeof patch[key] === 'object' &&
      !Array.isArray(patch[key]) &&
      base[key] &&
      typeof base[key] === 'object'
    ) {
      deepMerge(base[key], patch[key]);
    } else {
      base[key] = patch[key];
    }
  }
  return base;
}
