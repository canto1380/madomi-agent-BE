import { asyncHandler } from '../utils/asyncHandler.js';
import { responderErrorAdmin } from '../utils/adminResponder.js';
import { obtenerBrandingAdminServicio, actualizarBrandingServicio } from '../services/branding.service.js';

export const obtenerBrandingAdmin = asyncHandler(async (_req, res) => {
  try {
    const data = await obtenerBrandingAdminServicio();
    res.status(200).json({ data, error: null, message: 'OK' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});

export const actualizarBranding = asyncHandler(async (req, res) => {
  try {
    const data = await actualizarBrandingServicio(req.validatedData);
    res.status(200).json({ data, error: null, message: 'Branding actualizado' });
  } catch (error) {
    return responderErrorAdmin(res, error);
  }
});
