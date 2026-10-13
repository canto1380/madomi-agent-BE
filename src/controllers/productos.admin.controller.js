import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import {
  listarProductosAdminServicio,
  obtenerProductoAdminServicio,
  crearProductoServicio,
  actualizarProductoServicio,
  eliminarProductoServicio,
} from '../services/productos.service.js';
import { uploadMediaFile } from '../services/storage.service.js';

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

export const listarProductosAdmin = asyncHandler(async (req, res) => {
  const data = await listarProductosAdminServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerProductoAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerProductoAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const crearProducto = asyncHandler(async (req, res) => {
  try {
    const data = await crearProductoServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Producto creado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const actualizarProducto = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarProductoServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Producto actualizado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const eliminarProducto = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarProductoServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Producto desactivado' });
  } catch (error) {
    return responderError(res, error);
  }
});

export const subirImagenProducto = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        data: null,
        error: 'VALIDATION_ERROR',
        message: 'Debe enviar un archivo en el campo "file"',
      });
    }

    const data = await uploadMediaFile(req.file, {
      clave: req.body.productoId || req.body.clave || 'producto',
      modulo: 'productos',
      previousUrl: req.body.previousUrl,
    });

    res.status(201).json({ data, error: null, message: 'Imagen subida' });
  } catch (error) {
    return responderError(res, error);
  }
});
