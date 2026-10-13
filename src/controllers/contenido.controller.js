import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { obtenerContenidoPublicoServicio, obtenerContenidoPorSeccionServicio } from '../services/contenido.service.js';

export const obtenerContenido = asyncHandler(async (_req, res) => {
  const data = await obtenerContenidoPublicoServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerContenidoSeccion = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerContenidoPorSeccionServicio(req.validatedParams.seccion);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ data: null, error: error.code, message: error.message });
    }
    throw error;
  }
});
