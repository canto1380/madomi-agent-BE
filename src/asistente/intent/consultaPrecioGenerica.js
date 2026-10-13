import { extraerBusquedaProductoDesdeMensaje } from './busquedaProducto.js';

const TERMINOS_META = new Set([
  'para',
  'por',
  'ver',
  'saber',
  'consultar',
  'consulta',
  'precio',
  'precios',
  'producto',
  'productos',
  'hola',
  'buenas',
  'quiero',
  'queria',
  'quería',
  'necesito',
  'dame',
  'pasame',
  'pasame',
  'mostrar',
  'mostrame',
  'mostrá',
]);

/** "hola, para consultar precios" — sin producto concreto. */
export function esConsultaPrecioGenerica(mensaje) {
  const m = mensaje.trim().toLowerCase();
  const pidePrecio =
    /precio|precios|cu[aá]nto\s+sale|cu[aá]nto\s+cuesta|cotiz/.test(m) ||
    /consult(ar|a)\s+(los\s+)?precios?/.test(m) ||
    /(ver|saber)\s+(los\s+)?precios?/.test(m);

  if (!pidePrecio) {
    return false;
  }

  const { terminoPrincipal, terminos } = extraerBusquedaProductoDesdeMensaje(mensaje);
  const tokensProducto = terminos.filter((t) => !TERMINOS_META.has(t) && t.length >= 3);

  if (tokensProducto.length >= 1) {
    return false;
  }

  if (!terminoPrincipal || TERMINOS_META.has(terminoPrincipal.toLowerCase())) {
    return true;
  }

  if (terminoPrincipal.length <= 4 && TERMINOS_META.has(terminoPrincipal.toLowerCase())) {
    return true;
  }

  return tokensProducto.length === 0 && /consultar|precios?|saber|ver/.test(m);
}
