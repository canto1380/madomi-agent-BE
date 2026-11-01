import fs from 'fs/promises';
import path from 'path';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';

export function isConfigured() {
  return Boolean(env.STORAGE_LOCAL_DIR && env.STORAGE_PUBLIC_BASE_URL);
}

function segmentosSeguros(storagePath) {
  const limpio = String(storagePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const partes = limpio.split('/').filter(Boolean);

  if (!partes.length || partes.some((parte) => parte === '.' || parte === '..')) {
    throw new AppError('Ruta de archivo inválida', 400, 'VALIDATION_ERROR');
  }

  return partes;
}

function rutaAbsoluta(storagePath) {
  const raiz = path.resolve(env.STORAGE_LOCAL_DIR);
  const absoluta = path.resolve(raiz, ...segmentosSeguros(storagePath));
  const relativo = path.relative(raiz, absoluta);

  if (!relativo || relativo.startsWith('..') || path.isAbsolute(relativo)) {
    throw new AppError('Ruta de archivo inválida', 400, 'VALIDATION_ERROR');
  }

  return absoluta;
}

export function publicUrl(storagePath) {
  const base = env.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, '');
  const encoded = segmentosSeguros(storagePath).map((parte) => encodeURIComponent(parte)).join('/');
  return `${base}${env.STORAGE_PUBLIC_PREFIX}/${encoded}`;
}

export function extractPath(publicUrlValue) {
  if (!publicUrlValue || !env.STORAGE_PUBLIC_BASE_URL) return null;

  const marker = `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, '')}${env.STORAGE_PUBLIC_PREFIX}/`;
  if (!publicUrlValue.startsWith(marker)) return null;

  const resto = publicUrlValue.slice(marker.length).split('?')[0].split('#')[0];
  if (!resto) return null;

  try {
    return decodeURIComponent(resto);
  } catch {
    return null;
  }
}

export async function asegurarDirectorio() {
  await fs.mkdir(env.STORAGE_LOCAL_DIR, { recursive: true });
}

export async function put(storagePath, buffer, { upsert = false } = {}) {
  const absoluta = rutaAbsoluta(storagePath);
  await fs.mkdir(path.dirname(absoluta), { recursive: true });

  try {
    await fs.writeFile(absoluta, buffer, { flag: upsert ? 'w' : 'wx' });
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new AppError('El archivo ya existe en el servidor', 409, 'STORAGE_UPLOAD_ERROR');
    }
    throw new AppError('Error al guardar el archivo en el servidor', 500, 'STORAGE_UPLOAD_ERROR');
  }
}

export async function remove(storagePath) {
  const absoluta = rutaAbsoluta(storagePath);

  try {
    await fs.unlink(absoluta);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw new AppError('No se pudo eliminar el archivo anterior', 500, 'STORAGE_DELETE_ERROR');
  }
}
