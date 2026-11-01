import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';

let supabaseClient = null;

export function isConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET);
}

function getClient() {
  if (!isConfigured()) {
    throw new AppError('Supabase no está configurado en el servidor', 503, 'STORAGE_NOT_CONFIGURED');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return supabaseClient;
}

export function publicUrl(storagePath) {
  return `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${storagePath}`;
}

export function extractPath(publicUrlValue) {
  if (!publicUrlValue || !env.SUPABASE_URL || !env.SUPABASE_STORAGE_BUCKET) return null;

  const marker = `/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/`;
  const index = publicUrlValue.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(publicUrlValue.slice(index + marker.length).split('?')[0].split('#')[0]);
}

export async function put(storagePath, buffer, { contentType, upsert = false }) {
  const client = getClient();
  const { error } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert,
  });

  if (error) {
    throw new AppError(error.message || 'Error al subir archivo', 500, 'STORAGE_UPLOAD_ERROR');
  }
}

export async function remove(storagePath) {
  const client = getClient();
  const { error } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([storagePath]);

  if (error) {
    throw new AppError(error.message || 'No se pudo eliminar el archivo anterior', 500, 'STORAGE_DELETE_ERROR');
  }
}
