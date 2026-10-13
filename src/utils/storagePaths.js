const BRANDING_KEYS = new Set(['logo', 'logo-blanco', 'favicon']);
const BRANDING_PREFIXES = ['video-', 'hero-', 'historia-'];

const ALLOWED_FOLDERS = new Set(['branding', 'productos', 'categorias', 'media']);

export function sanitizeStorageFolder(name) {
  const cleaned = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return ALLOWED_FOLDERS.has(cleaned) ? cleaned : 'media';
}

/**
 * Resuelve la carpeta del bucket según módulo, clave o override explícito.
 * branding → logos, videos, favicon, hero, historia
 * productos → imágenes de catálogo
 * categorias → imágenes de categorías
 * media → assets genéricos
 */
export function resolveStorageFolder({ carpeta, clave, modulo } = {}) {
  if (carpeta) {
    return sanitizeStorageFolder(carpeta);
  }

  if (modulo === 'productos') return 'productos';
  if (modulo === 'categorias') return 'categorias';
  if (modulo === 'branding') return 'branding';

  const key = String(clave || '').trim().toLowerCase();
  if (!key) return 'media';

  if (BRANDING_KEYS.has(key)) return 'branding';
  if (BRANDING_PREFIXES.some((prefix) => key.startsWith(prefix))) return 'branding';
  if (key.startsWith('producto-') || key.startsWith('productos-')) return 'productos';
  if (key.startsWith('categoria-') || key.startsWith('categorias-')) return 'categorias';

  return 'media';
}
