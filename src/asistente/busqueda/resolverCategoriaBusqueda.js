import { ratioSimilitud, variantesTerminoBusqueda } from './similitudTexto.js';

/**
 * Resuelve categoría activa (tabla Categorias) a partir del texto del cliente.
 * Productos.categoria guarda el nombre visible (ej. "Humita").
 */
export function resolverCategoriaDesdeTexto(texto, categoriasActivas = []) {
  const t = texto?.trim().toLowerCase();
  if (!t || !categoriasActivas.length) {
    return null;
  }

  let mejor = null;
  let mejorScore = 0;

  for (const cat of categoriasActivas) {
    const nombre = (cat.nombre ?? '').toLowerCase();
    const slug = (cat.slug ?? '').toLowerCase();
    if (!nombre) {
      continue;
    }
    if (t.includes(nombre) || t.includes(slug)) {
      return cat.nombre;
    }
    const simNom = ratioSimilitud(t, nombre);
    const simSlug = slug ? ratioSimilitud(t, slug) : 0;
    const score = Math.max(simNom, simSlug);
    if (score >= 0.75 && score > mejorScore) {
      mejorScore = score;
      mejor = cat.nombre;
    }
    for (const token of t.split(/\s+/)) {
      for (const v of variantesTerminoBusqueda(token)) {
        if (nombre.includes(v) || v.includes(nombre) || (slug && slug.includes(v))) {
          return cat.nombre;
        }
      }
    }
  }

  return mejor;
}
