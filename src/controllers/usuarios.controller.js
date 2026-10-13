import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  listarUsuariosServicio,
  obtenerUsuarioServicio,
  crearUsuarioServicio,
  actualizarUsuarioServicio,
  eliminarUsuarioServicio,
  reactivarUsuarioServicio,
  cambiarRolUsuarioServicio,
} from '../services/usuarios.service.js';

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

export const listarUsuarios = asyncHandler(async (req, res) => {
  const data = await listarUsuariosServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerUsuario = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerUsuarioServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const crearUsuario = asyncHandler(async (req, res) => {
  try {
    const data = await crearUsuarioServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Usuario creado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarUsuario = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarUsuarioServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Usuario actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const eliminarUsuario = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarUsuarioServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Usuario desactivado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const reactivarUsuario = asyncHandler(async (req, res) => {
  try {
    const data = await reactivarUsuarioServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Usuario reactivado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const cambiarRolUsuario = asyncHandler(async (req, res) => {
  try {
    const data = await cambiarRolUsuarioServicio(
      req.validatedParams.id,
      req.validatedData.rolId,
    );
    res.status(200).json({ data, error: null, message: 'Rol actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});
