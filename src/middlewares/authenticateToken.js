import { verificarAccessToken } from '../utils/jwt.js';
import { buscarUsuarioPorIdPublicoRepositorio } from '../repositories/auth.repository.js';

/**
 * Verifica JWT de access token y adjunta req.usuario (sin claveEncriptada).
 * No responde directamente; usar requireAuth para exigir sesión.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    let payload;

    try {
      payload = verificarAccessToken(token);
    } catch {
      return next();
    }

    const usuario = await buscarUsuarioPorIdPublicoRepositorio(payload.sub);
    if (!usuario || !usuario.activo) {
      return next();
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
};
