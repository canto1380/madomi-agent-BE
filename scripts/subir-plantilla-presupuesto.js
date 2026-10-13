/**
 * @deprecated La plantilla PNG ya no se embebe en el PDF.
 * Usá `plantilla-presupuesto.png` solo como referencia visual y calibrá
 * `layoutMadomiV1.js` / PRESUPUESTO_PDF_LAYOUT en .env.
 *
 * Para previsualizar: node scripts/preview-pdf-presupuesto.js
 */
console.log(`
La plantilla PNG NO se usa como fondo del PDF.

El diseño se genera en código: backend/src/asistente/presupuesto/layoutMadomiV1.js
Referencia visual: backend/src/asistente/presupuesto/plantilla-presupuesto.png

Previsualizar PDF:
  node scripts/preview-pdf-presupuesto.js

Ajuste fino (opcional en .env):
  PRESUPUESTO_PDF_LAYOUT={"tabla":{"y":260},"pie":{"webBarY":780}}
`);
