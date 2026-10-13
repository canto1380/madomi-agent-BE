import { AppError } from '../errors/AppError.js';

export function responderErrorAdmin(res, error) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      data: null,
      error: error.code,
      message: error.message,
    });
  }
  throw error;
}

export function parsearFiltroActivo(query) {
  if (query.activo === 'true') return true;
  if (query.activo === 'false') return false;
  return undefined;
}

export function parsearOrdenAdmin(query, camposPermitidos, defaultSort = 'orden') {
  return {
    sort: camposPermitidos.includes(query.sort) ? query.sort : defaultSort,
    order: query.order === 'desc' ? 'desc' : 'asc',
  };
}
