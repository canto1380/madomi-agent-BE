import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  obtenerEmpresaAsistenteAdminServicio,
  listarContextosAdminServicio,
  obtenerContextoVigenteAdminServicio,
  actualizarAsistenteBotAdminServicio,
  obtenerSaludRuntimeAsistenteAdminServicio,
} from '../services/asistente-infra.service.js';

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

export const obtenerEmpresaAsistenteAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerEmpresaAsistenteAdminServicio();
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const listarContextosAsistenteAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await listarContextosAdminServicio(req.query);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarAsistenteBotAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarAsistenteBotAdminServicio(req.validatedData);
    res.status(200).json({ data, error: null, message: 'Bot actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const obtenerSaludRuntimeAsistenteAdmin = asyncHandler(async (req, res) => {
  try {
    const horas = Math.min(Number(req.query.horas) || 24, 168);
    const data = await obtenerSaludRuntimeAsistenteAdminServicio({ horasMetricas: horas });
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const obtenerContextoVigenteAsistenteAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerContextoVigenteAdminServicio(req.query.tipo);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});
