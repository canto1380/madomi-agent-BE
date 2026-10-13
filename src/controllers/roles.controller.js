import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  listarRolesServicio,
  obtenerRolServicio,
  crearRolServicio,
  actualizarRolServicio,
  eliminarRolServicio,
  sincronizarPermisosRolServicio,
} from '../services/roles.service.js';

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

export const listarRoles = asyncHandler(async (req, res) => {
  const data = await listarRolesServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerRol = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerRolServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const crearRol = asyncHandler(async (req, res) => {
  try {
    const data = await crearRolServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Rol creado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarRol = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarRolServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Rol actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const eliminarRol = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarRolServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Rol eliminado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const sincronizarPermisosRol = asyncHandler(async (req, res) => {
  try {
    const data = await sincronizarPermisosRolServicio(
      req.validatedParams.id,
      req.validatedData.permisoIds,
    );
    res.status(200).json({ data, error: null, message: 'Permisos sincronizados' });
  } catch (error) {
    return responderError(res, error);
  }
});
