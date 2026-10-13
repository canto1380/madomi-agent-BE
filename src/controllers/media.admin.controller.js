import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import {
  listarMediaAdminServicio,
  obtenerMediaAdminServicio,
  crearMediaServicio,
  actualizarMediaServicio,
  eliminarMediaServicio,
} from '../services/media.service.js';
import { uploadMediaFile } from '../services/storage.service.js';

export const listarMediaAdmin = asyncHandler(async (req, res) => {
  const data = await listarMediaAdminServicio(req.query);
  res.status(200).json({ data, error: null, message: 'OK' });
});

export const obtenerMediaAdmin = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerMediaAdminServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const crearMedia = asyncHandler(async (req, res) => {
  try {
    const data = await crearMediaServicio(req.validatedData);
    res.status(201).json({ data, error: null, message: 'Media creado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarMedia = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarMediaServicio(req.validatedParams.id, req.validatedData);
    res.status(200).json({ data, error: null, message: 'Media actualizado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const eliminarMedia = asyncHandler(async (req, res) => {
  try {
    const data = await eliminarMediaServicio(req.validatedParams.id);
    res.status(200).json({ data, error: null, message: 'Media desactivado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const subirMediaArchivo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        data: null,
        error: 'VALIDATION_ERROR',
        message: 'Debe enviar un archivo en el campo "file"',
      });
    }

    const data = await uploadMediaFile(req.file, {
      clave: req.body.clave,
      carpeta: req.body.carpeta,
      modulo: req.body.modulo || 'media',
      previousUrl: req.body.previousUrl,
    });

    res.status(201).json({ data, error: null, message: 'Archivo subido' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
