import { createHash } from 'crypto';

export function hashContenido(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}
