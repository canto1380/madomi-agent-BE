import { env } from '../../config/env.js';
import { mergeLayoutMadomiV1 } from './layoutMadomiV1.js';

export function obtenerLayoutPresupuestoPdf() {
  const raw = env.PRESUPUESTO_PDF_LAYOUT?.trim();
  if (!raw) {
    return mergeLayoutMadomiV1();
  }
  try {
    return mergeLayoutMadomiV1(JSON.parse(raw));
  } catch {
    return mergeLayoutMadomiV1();
  }
}
