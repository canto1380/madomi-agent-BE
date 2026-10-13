import { env } from '../../config/env.js';

export function resolverModoStockAlCerrar() {
  if (env.ASISTENTE_DECREMENTAR_STOCK) {
    return 'descontar';
  }
  const modo = env.ASISTENTE_STOCK_AL_CERRAR;
  if (modo === 'descontar' || modo === 'ninguno' || modo === 'comprometer') {
    return modo;
  }
  return 'comprometer';
}
