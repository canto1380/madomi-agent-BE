import { listarDestacadosActivosRepositorio } from '../../repositories/destacados.repository.js';
import { SECCION_NUEVO } from '../../utils/productoDestacados.js';
import { PRODUCTOS_NOVEDADES_IDS } from '../constants/novedades.js';

/** IDs de "Lo último" / novedades — misma fuente que landing (`GET /api/productos/destacados`). */
export async function listarIdsProductosNovedades() {
  const destacados = await listarDestacadosActivosRepositorio(SECCION_NUEVO);
  const ids = destacados.map((d) => d.productoId).filter(Boolean);
  return ids.length ? ids : [...PRODUCTOS_NOVEDADES_IDS];
}
