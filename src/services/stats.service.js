import { obtenerConteosCMSRepositorio } from '../repositories/stats.repository.js';

export async function obtenerStatsAdminServicio() {
  return obtenerConteosCMSRepositorio();
}
