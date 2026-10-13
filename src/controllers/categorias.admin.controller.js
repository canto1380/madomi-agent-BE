import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import {
  listarCategoriasAdminServicio,
  obtenerCategoriaAdminServicio,
  crearCategoriaServicio,
  actualizarCategoriaServicio,
  eliminarCategoriaServicio,
} from '../services/categorias.service.js';

export const listarCategoriasAdmin = asyncHandler(async (req, res) => {
  const data = await listarCategoriasAdminServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerCategoriaAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerCategoriaAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const crearCategoria = asyncHandler(async (req, res) => {
  try {
    const data = await crearCategoriaServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Categoría creada' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarCategoria = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarCategoriaServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Categoría actualizada' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const eliminarCategoria = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarCategoriaServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Categoría desactivada' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
