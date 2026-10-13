import { asyncHandler } from '../utils/asyncHandler.js';
import { obtenerStatsAdminServicio } from '../services/stats.service.js';

export const obtenerStatsAdmin = asyncHandler(async (_req, res) => {
  const data = await obtenerStatsAdminServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});
