import { asyncHandler } from '../utils/asyncHandler.js';
import { listarCategoriasServicio } from '../services/categorias.service.js';

export const listarCategorias = asyncHandler(async (_req, res) => {
  const data = await listarCategoriasServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});
