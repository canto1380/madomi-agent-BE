import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  registrarServicio,
  loginServicio,
  refreshServicio,
  logoutServicio,
  obtenerUsuarioActualServicio,
} from '../services/auth.service.js';

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

export const register = asyncHandler(async (req, res) => {
  try {
    const data = await registrarServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Registro exitoso' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const data = await loginServicio(req.validatedData);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const data = await refreshServicio(req.validatedData);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const logout = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.validatedData?.refreshToken;
    await logoutServicio({ refreshToken });
    res.status(200).json({ data: { ok: true }, error: null, message: 'Sesión cerrada' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const me = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerUsuarioActualServicio(req.usuario.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});
