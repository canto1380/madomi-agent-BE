import { INTENCION } from './interpretarTurno.js';

/** Turnos simples: el borrador ya es suficiente (evita 10–90 s esperando LLM). */
const INTENCIONES_SIN_REDACT = new Set([
  INTENCION.SALUDO,
  INTENCION.SALUDO_CORDIAL,
  INTENCION.DESPEDIDA,
  INTENCION.AGRADECIMIENTO,
  INTENCION.CONFIRMACION_NO,
  INTENCION.DATOS_CONTACTO,
]);

export function debeRedactarTurnoConLlm(intencion, mensajeUsuario = '') {
  const t = mensajeUsuario.trim().toLowerCase();
  if (
    t.length <= 30 &&
    /^(ok|dale|si|sí|bueno|gracias|listo|y\??|d[ií]a\s*y\??|hol[aá]?|genial)$/.test(t)
  ) {
    return false;
  }
  if (intencion === INTENCION.OTRO && t.length <= 35) {
    return false;
  }
  if (
    intencion === INTENCION.PRECIO &&
    (/consultar\s+precios?|para\s+consultar|precios?\s+(en\s+)?general/.test(t) ||
      (t.length <= 55 && /precios?/.test(t) && !/\b(ravioles|sorrentinos|ñoquis|bondiola|humita|guiso|fideos|capelletti|masa)\b/.test(t)))
  ) {
    return false;
  }
  return !INTENCIONES_SIN_REDACT.has(intencion);
}
