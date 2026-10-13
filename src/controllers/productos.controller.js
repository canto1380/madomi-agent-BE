import { asyncHandler } from '../utils/asyncHandler.js';
import { listarProductosServicio } from '../services/productos.service.js';

export const listarProductos = asyncHandler(async (_req, res) => {
  const data = await listarProductosServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});
