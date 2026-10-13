import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import { obtenerContactoAdminServicio, actualizarContactoServicio } from '../services/contacto.service.js';

export const obtenerContactoAdmin = asyncHandler(async (_req, res) => {
  try {
    const data = await obtenerContactoAdminServicio();
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarContacto = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarContactoServicio(req.validatedData);
    res.status(200).json({ data, error: null, message: 'Contacto actualizado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
