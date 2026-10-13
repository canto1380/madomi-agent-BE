import { asyncHandler } from '../utils/asyncHandler.js';
import { listarDestacadosPublicoServicio } from '../services/destacados.service.js';

export const listarDestacados = asyncHandler(async (req, res) => {
  const seccion = req.query.seccion?.trim() || 'lo_ultimo';
  const data = await listarDestacadosPublicoServicio(seccion);
  res.status(200).json({ data, error: null, message: 'OK' });
});
