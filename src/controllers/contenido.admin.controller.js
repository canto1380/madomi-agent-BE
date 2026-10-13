import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import {
  listarContenidoAdminServicio,
  obtenerContenidoAdminServicio,
  crearContenidoServicio,
  actualizarContenidoServicio,
  eliminarContenidoServicio,
} from '../services/contenido.service.js';

export const listarContenidoAdmin = asyncHandler(async (req, res) => {
  const data = await listarContenidoAdminServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerContenidoAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerContenidoAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const crearContenido = asyncHandler(async (req, res) => {
  try {
    const data = await crearContenidoServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Texto creado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarContenido = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarContenidoServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Texto actualizado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const eliminarContenido = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarContenidoServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Texto desactivado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
