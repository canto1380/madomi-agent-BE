import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';

export const errorMiddleware = (err, req, res, _next) => {
  if (res.headersSent) {
    console.error('[API] error tras iniciar respuesta (p. ej. SSE):', err);
    if (!res.writableEnded) {
      res.end();
    }
    return undefined;
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      data: null,
      error: err.code,
      message: err.message,
    });
  }

  console.error('[API]', err);

  return res.status(500).json({
    data: null,
    error: 'INTERNAL_ERROR',
    message:
      env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno del servidor',
  });
};
