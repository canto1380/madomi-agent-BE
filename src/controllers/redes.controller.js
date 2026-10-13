import { asyncHandler } from '../utils/asyncHandler.js';
import { listarRedesServicio } from '../services/redes.service.js';

export const listarRedes = asyncHandler(async (_req, res) => {
  const data = await listarRedesServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});
