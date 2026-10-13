/**
 * Envuelve handlers async de Express para propagar errores al middleware de errores.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
