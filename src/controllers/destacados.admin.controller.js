import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import {
  listarDestacadosAdminServicio,
  obtenerDestacadoAdminServicio,
  crearDestacadoServicio,
  actualizarDestacadoServicio,
  eliminarDestacadoServicio,
} from '../services/destacados.service.js';

export const listarDestacadosAdmin = asyncHandler(async (req, res) => {
  const data = await listarDestacadosAdminServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerDestacadoAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerDestacadoAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const crearDestacado = asyncHandler(async (req, res) => {
  try {
    const data = await crearDestacadoServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Destacado creado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarDestacado = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarDestacadoServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Destacado actualizado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const eliminarDestacado = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarDestacadoServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Destacado desactivado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
