import { AgenteRun } from '../models/AgenteRun.js';

export async function crearAgenteRunRepositorio(datos) {
  const doc = await AgenteRun.create(datos);
  return doc.toObject();
}

/**
 * Métricas agregadas para monitoreo admin (fase 4 prod).
 */
export async function resumenAgenteRunsRepositorio({ horas = 24 } = {}) {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000);
  const filtro = { createdAt: { $gte: desde } };

  const [totales, conError, latencia, porModelo] = await Promise.all([
    AgenteRun.countDocuments(filtro),
    AgenteRun.countDocuments({ ...filtro, error: { $ne: null } }),
    AgenteRun.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: null,
          latenciaPromedioMs: { $avg: '$latenciaMs' },
          latenciaMaxMs: { $max: '$latenciaMs' },
          toolCallsPromedio: { $avg: '$toolCallsCount' },
        },
      },
    ]),
    AgenteRun.aggregate([
      { $match: filtro },
      { $group: { _id: '$modelo', count: { $sum: 1 }, errores: { $sum: { $cond: [{ $ne: ['$error', null] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const lat = latencia[0] ?? {};

  return {
    periodoHoras: horas,
    totalTurnos: totales,
    turnosConError: conError,
    tasaError: totales ? Math.round((conError / totales) * 1000) / 10 : 0,
    latenciaPromedioMs: lat.latenciaPromedioMs ? Math.round(lat.latenciaPromedioMs) : 0,
    latenciaMaxMs: lat.latenciaMaxMs ?? 0,
    toolCallsPromedio: lat.toolCallsPromedio ? Math.round(lat.toolCallsPromedio * 10) / 10 : 0,
    porModelo: porModelo.map((r) => ({
      modelo: r._id,
      turnos: r.count,
      errores: r.errores,
    })),
  };
}
