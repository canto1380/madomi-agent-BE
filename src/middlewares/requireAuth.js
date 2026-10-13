/**
 * Exige que authenticateToken haya adjuntado req.usuario.
 */
export const requireAuth = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      data: null,
      error: 'UNAUTHORIZED',
      message: 'Autenticación requerida',
    });
  }
  next();
};
