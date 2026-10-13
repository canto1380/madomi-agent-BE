import { requireAuth } from './requireAuth.js';

/**
 * Exige al menos uno de los permisos indicados (códigos en `req.usuario.permisosCodigos`).
 * Usar después de authenticateToken + requireAuth.
 */
export function requirePermiso(...codigosPermiso) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const codigos = req.usuario?.permisosCodigos ?? [];
      const permitido = codigosPermiso.some((codigo) => codigos.includes(codigo));

      if (!permitido) {
        return res.status(403).json({
          data: null,
          error: 'FORBIDDEN',
          message: 'No tenés permiso para esta acción',
        });
      }

      next();
    });
  };
}
