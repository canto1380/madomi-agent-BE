import { extraerBusquedaProductoDesdeMensaje } from './busquedaProducto.js';
import { mensajeIndicaDatosPersonales, mensajePareceDatosContacto } from './extraerDatosContacto.js';

const STOP_FRASE = new Set([
  'hola',
  'consultar',
  'precios',
  'precio',
  'productos',
  'producto',
  'nuevos',
  'nuevo',
  'queria',
  'quería',
  'tienen',
  'para',
  'por',
  'ver',
  'saber',
  'consulta',
]);

function colaProductoDesdeSegmento(segmento) {
  const limpio = segmento.trim();
  if (!limpio) {
    return null;
  }
  const trozo = limpio.includes(',') ? limpio.split(',').pop().trim() : limpio;
  return trozo.replace(/^(?:la|el|los|las|del|de la|de los|de las)\s+/i, '').trim();
}

function fraseEsBusquedaValida(frase) {
  const { terminoPrincipal } = extraerBusquedaProductoDesdeMensaje(frase);
  if (!terminoPrincipal || terminoPrincipal.length < 3) {
    return false;
  }
  if (/^\d{8,}$/.test(terminoPrincipal)) {
    return false;
  }
  if (STOP_FRASE.has(terminoPrincipal)) {
    return false;
  }
  return true;
}

/**
 * Separa menciones de productos unidas por "y" / "e".
 * @returns {string[]} frases aptas para buscarProductos
 */
export function extraerFrasesProducto(mensaje) {
  if (mensajePareceDatosContacto(mensaje) || mensajeIndicaDatosPersonales(mensaje)) {
    return [];
  }

  if (
    /\b(ravioles|sorrentinos|capellettis|ñoquis|noquis|fideos)\b.+\s(y|e)\s+/i.test(mensaje) &&
    mensaje.length < 120
  ) {
    return [mensaje.trim().slice(0, 120)];
  }

  const segmentos = mensaje
    .split(/\s+(?:y|e)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  if (segmentos.length <= 1) {
    if (!fraseEsBusquedaValida(mensaje)) {
      return [];
    }
    const unica = extraerBusquedaProductoDesdeMensaje(mensaje);
    if (unica.terminoPrincipal && !/^\d{8,}$/.test(unica.terminoPrincipal)) {
      return [unica.terminoPrincipal.slice(0, 80)];
    }
    return [];
  }

  const frases = [];
  const seen = new Set();

  for (const seg of segmentos) {
    const cola = colaProductoDesdeSegmento(seg);
    if (!cola || !fraseEsBusquedaValida(cola)) {
      continue;
    }
    const key = cola.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    frases.push(cola);
  }

  return frases.slice(0, 4);
}
