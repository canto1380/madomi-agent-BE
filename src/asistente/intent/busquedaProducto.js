/** Palabras vacías al armar búsqueda de catálogo (español rioplatense, chat). */
const STOPWORDS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'la',
  'las',
  'lo',
  'los',
  'me',
  'mi',
  'o',
  'para',
  'por',
  'que',
  'qué',
  'se',
  'si',
  'sí',
  'te',
  'tu',
  'un',
  'una',
  'uno',
  'y',
  'hola',
  'buenas',
  'buen',
  'dia',
  'día',
  'precio',
  'precios',
  'cuanto',
  'cuánto',
  'sale',
  'cuesta',
  'stock',
  'hay',
  'disponible',
  'envio',
  'envío',
  'entrega',
  'demora',
  'localidad',
  'quiero',
  'necesito',
  'madomi',
  'pastas',
  'gracias',
  'productos',
  'producto',
  'tienen',
  'tenes',
  'tenés',
  'tengo',
  'variedades',
  'catalogo',
  'catálogo',
  'listado',
  'mostrar',
  'mostrame',
  'mostrá',
  'ver',
  'consultar',
  'consulta',
  'consultaba',
  'queria',
  'quería',
  'nuevo',
  'nuevos',
  'novedad',
  'novedades',
  'sobre',
  'los',
  'las',
  'para',
  'por',
  'ver',
  'saber',
]);

/**
 * Extrae término de búsqueda desde el mensaje (sin listas fijas de categorías).
 * La categoría comercial se resuelve en runtime contra Postgres (`Categorias`).
 * @returns {{ terminoPrincipal: string | null, terminos: string[] }}
 */
export function extraerBusquedaProductoDesdeMensaje(mensaje) {
  const normalizado = mensaje
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const palabras = normalizado.split(' ').filter(Boolean);
  const terminos = palabras.filter(
    (p) => !STOPWORDS.has(p) && (p.length >= 2 || /^\d+$/.test(p)),
  );

  const pareceTelefono = /\b3[0-9]{9}\b/.test(normalizado) || /\b381[0-9]{7}\b/.test(normalizado);
  if (pareceTelefono && terminos.every((t) => /^\d+$/.test(t) || t.length <= 3)) {
    return { terminoPrincipal: null, terminos: [] };
  }

  let terminoPrincipal = null;
  if (terminos.length > 0) {
    terminoPrincipal = terminos.join(' ').slice(0, 80);
  } else if (normalizado.length >= 3 && normalizado.length <= 48) {
    terminoPrincipal = normalizado.slice(0, 40);
  }

  return {
    terminoPrincipal: terminoPrincipal || null,
    terminos,
  };
}
