import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { resolveStorageFolder } from '../utils/storagePaths.js';
import * as localDriver from './storage/local.driver.js';
import * as supabaseDriver from './storage/supabase.driver.js';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function driverActivo() {
  return env.STORAGE_DRIVER === 'local' ? localDriver : supabaseDriver;
}

export function isSupabaseConfigured() {
  return supabaseDriver.isConfigured();
}

export function isStorageConfigured() {
  return driverActivo().isConfigured();
}

export function extractStoragePath(publicUrl) {
  return localDriver.extractPath(publicUrl) || supabaseDriver.extractPath(publicUrl);
}

export async function prepararStorage() {
  if (env.STORAGE_DRIVER === 'local' && localDriver.isConfigured()) {
    await localDriver.asegurarDirectorio();
  }
}

function assertStorageListo() {
  if (isStorageConfigured()) return;

  const mensaje =
    env.STORAGE_DRIVER === 'local'
      ? 'Falta STORAGE_PUBLIC_BASE_URL para publicar los archivos del servidor'
      : 'Supabase no está configurado en el servidor';

  throw new AppError(mensaje, 503, 'STORAGE_NOT_CONFIGURED');
}

export async function deleteStorageFile(publicUrl) {
  const localPath = localDriver.extractPath(publicUrl);
  if (localPath) {
    await localDriver.remove(localPath);
    return;
  }

  const remotePath = supabaseDriver.extractPath(publicUrl);
  if (!remotePath || !supabaseDriver.isConfigured()) return;

  await supabaseDriver.remove(remotePath);
}

async function guardarBuffer(storagePath, buffer, { contentType, upsert }) {
  assertStorageListo();
  const driver = driverActivo();
  await driver.put(storagePath, buffer, { contentType, upsert });
  return driver.publicUrl(storagePath);
}

export async function uploadMediaFile(file, { clave, carpeta, modulo, previousUrl } = {}) {
  if (!file?.buffer) {
    throw new AppError('No se recibió ningún archivo', 400, 'VALIDATION_ERROR');
  }

  assertStorageListo();

  const safeClave = String(clave || 'media')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 48);

  let buffer = file.buffer;
  let contentType = file.mimetype;
  let extension = 'bin';
  let tipo = 'otro';

  if (IMAGE_MIMES.has(file.mimetype)) {
    buffer = await sharp(file.buffer).rotate().webp({ quality: 82 }).toBuffer();
    contentType = 'image/webp';
    extension = 'webp';
    tipo = 'imagen';
  } else if (VIDEO_MIMES.has(file.mimetype)) {
    extension = file.originalname?.split('.').pop()?.toLowerCase() || 'mp4';
    tipo = 'video';
  } else {
    throw new AppError('Tipo de archivo no soportado. Usá imagen o video.', 400, 'VALIDATION_ERROR');
  }

  const folder = resolveStorageFolder({ carpeta, clave: safeClave, modulo });
  const storagePath = `${folder}/${safeClave}/${randomUUID()}.${extension}`;
  const url = await guardarBuffer(storagePath, buffer, { contentType, upsert: false });

  if (previousUrl) {
    try {
      await deleteStorageFile(previousUrl);
    } catch (deleteError) {
      console.warn('[storage] No se pudo borrar archivo anterior:', deleteError.message);
    }
  }

  return {
    url,
    tipo,
    carpeta: folder,
  };
}

/** Subida genérica (PDF presupuestos, etc.). */
export async function uploadBufferToStorage(buffer, { storagePath, contentType = 'application/pdf' }) {
  if (!buffer?.length) {
    throw new AppError('Buffer vacío', 400, 'VALIDATION_ERROR');
  }

  const path = storagePath.replace(/^\/+/, '');
  return guardarBuffer(path, buffer, { contentType, upsert: true });
}
