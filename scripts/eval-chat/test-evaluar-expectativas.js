import { evaluarExpectativas } from './evaluarExpectativas.js';

const base = { respuesta: '', presupuestoId: null, latenciaMs: 100, toolCallsCount: 0 };

console.assert(
  evaluarExpectativas({ montoArsEnRespuesta: true }, {
    ...base,
    respuesta: 'Sale a $3.500 ARS por unidad',
  }).length === 0,
  'montoArs ok',
);

console.assert(
  evaluarExpectativas({ noFallbackError: true }, {
    ...base,
    respuesta: 'Disculpá, hubo un problema momentáneo',
  }).length > 0,
  'detecta fallback',
);

console.assert(
  evaluarExpectativas({ minToolCalls: 1 }, { ...base, toolCallsCount: 2 }).length === 0,
  'minToolCalls',
);

console.log('test-evaluar-expectativas: OK');
