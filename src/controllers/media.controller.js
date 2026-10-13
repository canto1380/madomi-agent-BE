import { asyncHandler } from '../utils/asyncHandler.js';
import { listarMediaServicio } from '../services/media.service.js';

export const listarMedia = asyncHandler(async (_req, res) => {
  const data = await listarMediaServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});
