import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  listarLeadsAdminServicio,
  obtenerLeadAdminServicio,
  actualizarLeadAdminServicio,
  obtenerConversacionAdminServicio,
  listarPresupuestosAdminServicio,
  obtenerPresupuestoPdfAdminServicio,
  listarPedidosAdminServicio,
  actualizarPedidoAdminServicio,
  statsResumenCrmServicio,
  statsCuelloBotellaCrmServicio,
  publicarContextoCrmServicio,
} from '../services/crm.service.js';

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

export const listarLeadsAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await listarLeadsAdminServicio(req.query);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const obtenerLeadAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerLeadAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarLeadAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarLeadAdminServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Lead actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const obtenerConversacionAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerConversacionAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const listarPresupuestosAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await listarPresupuestosAdminServicio(req.query);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const obtenerPresupuestoPdfAdmin = asyncHandler(async (req, res) => {
  try {
    const { pdfUrl } = await obtenerPresupuestoPdfAdminServicio(req.validatedParams.id);
    return res.redirect(302, pdfUrl);
  } catch (error) {
    return responderError(res, error);
  }
});

export const listarPedidosAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await listarPedidosAdminServicio(req.query);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarPedidoAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarPedidoAdminServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Pedido actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const statsResumenCrmAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await statsResumenCrmServicio();
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const statsCuelloBotellaCrmAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await statsCuelloBotellaCrmServicio();
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const publicarContextoCrmAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await publicarContextoCrmServicio(req.validatedData);
    const message = data.duplicado ? 'Contexto ya vigente (mismo contenido)' : 'Contexto publicado';
    res.status(data.duplicado ? 200 : 201).json({ data, error: null, message });
  } catch (error) {
    return responderError(res, error);
  }
});
