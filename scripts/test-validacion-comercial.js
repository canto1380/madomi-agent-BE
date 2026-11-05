import {
  extraerMontosArsEnTexto,
  aplicarValidacionComercialRespuesta,
} from '../src/asistente/commerce/validarRespuestaComercial.js';

const montos = extraerMontosArsEnTexto('La Humita cuesta $3.500 y la bondiola $1.350,45');
console.assert(montos.includes(3500), 'extrae 3500');
console.assert(montos.some((m) => Math.abs(m - 1350.45) < 0.01), 'extrae 1350.45');

const tools = [
  {
    tool: 'consultarPrecio',
    result: { encontrado: true, nombre: 'Humita', precioFinal: 3500 },
  },
];
const corregido = aplicarValidacionComercialRespuesta('Sale $9999 la humita', tools);
console.assert(corregido.includes('3500'), 'reemplaza monto ilegal con verificado');
console.assert(!corregido.includes('9999'), 'elimina 9999');
console.assert(corregido.includes('Dato verificado'), 'añade bloque si faltaba monto');

const yaOk = aplicarValidacionComercialRespuesta('La Humita cuesta $3.500 ARS', tools);
console.assert(!yaOk.includes('Dato verificado'), 'no duplica si el LLM ya citó el monto');

console.log('test-validacion-comercial: OK');
