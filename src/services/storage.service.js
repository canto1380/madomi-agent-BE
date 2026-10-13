import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { resolveStorageFolder } from '../utils/storagePaths.js';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

let supabaseClient = null;

function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new AppError('Supabase no está configurado en el servidor', 503, 'STORAGE_NOT_CONFIGURED');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return supabaseClient;
}

export function isSupabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET);
}

function buildPublicUrl(path) {
  return `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${path}`;
}

export function extractStoragePath(publicUrl) {
  if (!publicUrl || !env.SUPABASE_URL || !env.SUPABASE_STORAGE_BUCKET) return null;

  const marker = `/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export async function deleteStorageFile(publicUrl) {
  const path = extractStoragePath(publicUrl);
  if (!path) return;

  const client = getSupabase();
  const { error } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new AppError(error.message || 'No se pudo eliminar el archivo anterior', 500, 'STORAGE_DELETE_ERROR');
  }
}

export async function uploadMediaFile(file, { clave, carpeta, modulo, previousUrl } = {}) {
  if (!file?.buffer) {
    throw new AppError('No se recibió ningún archivo', 400, 'VALIDATION_ERROR');
  }

  const client = getSupabase();
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
  const path = `${folder}/${safeClave}/${randomUUID()}.${extension}`;

  const { error } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new AppError(error.message || 'Error al subir archivo', 500, 'STORAGE_UPLOAD_ERROR');
  }

  if (previousUrl) {
    try {
      await deleteStorageFile(previousUrl);
    } catch (deleteError) {
      console.warn('[storage] No se pudo borrar archivo anterior:', deleteError.message);
    }
  }

  return {
    url: buildPublicUrl(path),
    tipo,
    carpeta: folder,
  };
}

/** Subida genérica (PDF presupuestos, etc.). */
export async function uploadBufferToStorage(buffer, { storagePath, contentType = 'application/pdf' }) {
  if (!buffer?.length) {
    throw new AppError('Buffer vacío', 400, 'VALIDATION_ERROR');
  }

  const client = getSupabase();
  const path = storagePath.replace(/^\/+/, '');

  const { error } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new AppError(error.message || 'Error al subir archivo', 500, 'STORAGE_UPLOAD_ERROR');
  }

  return buildPublicUrl(path);
}
