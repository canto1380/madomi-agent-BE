import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { obtenerContactoPublicoServicio } from '../services/contacto.service.js';

export const obtenerContacto = asyncHandler(async (_req, res) => {
  try {
    const data = await obtenerContactoPublicoServicio();
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ data: null, error: error.code, message: error.message });
    }
    throw error;
  }
});
