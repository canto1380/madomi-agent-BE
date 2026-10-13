import { env } from '../config/env.js';

const buckets = new Map();

function claveBucket(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const session = req.body?.sessionAnonimaId;
  return `${ip}:${session ?? ''}`;
}

export function chatRateLimitMiddleware(req, res, next) {
  const windowMs = env.CHAT_RATE_LIMIT_WINDOW_MS;
  const max = env.CHAT_RATE_LIMIT_MAX;
  const key = claveBucket(req);
  const ahora = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || ahora - bucket.inicio > windowMs) {
    bucket = { inicio: ahora, count: 0 };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > max) {
    return res.status(429).json({
      data: null,
      error: 'RATE_LIMIT',
      message: 'Demasiadas solicitudes. Intentá de nuevo en unos segundos.',
    });
  }

  return next();
}
