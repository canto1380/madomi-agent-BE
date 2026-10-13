import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import {
  listarRedesAdminServicio,
  obtenerRedAdminServicio,
  crearRedServicio,
  actualizarRedServicio,
  eliminarRedServicio,
} from '../services/redes.service.js';

export const listarRedesAdmin = asyncHandler(async (req, res) => {
  const data = await listarRedesAdminServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerRedAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerRedAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const crearRed = asyncHandler(async (req, res) => {
  try {
    const data = await crearRedServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Red social creada' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarRed = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarRedServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Red social actualizada' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const eliminarRed = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarRedServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Red social desactivada' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
