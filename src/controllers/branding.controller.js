import { asyncHandler } from '../utils/asyncHandler.js';
import { obtenerBrandingPublicoServicio } from '../services/branding.service.js';

export const obtenerBranding = asyncHandler(async (_req, res) => {
  const data = await obtenerBrandingPublicoServicio();
  res.status(200).json({ data, error: null, message: 'OK' });
});
