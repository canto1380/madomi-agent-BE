import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  listarPermisosServicio,
  obtenerPermisoServicio,
  crearPermisoServicio,
  actualizarPermisoServicio,
  eliminarPermisoServicio,
} from '../services/permisos.service.js';

const responderError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      data: null,
      error: error.code,
      message: error.message,
    });
  }
  throw error;
};

export const listarPermisos = asyncHandler(async (req, res) => {
  const data = await listarPermisosServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerPermiso = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerPermisoServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const crearPermiso = asyncHandler(async (req, res) => {
  try {
    const data = await crearPermisoServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Permiso creado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarPermiso = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarPermisoServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Permiso actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const eliminarPermiso = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarPermisoServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Permiso eliminado' });
  } catch (error) {
    return responderError(res, error);
  }
});
