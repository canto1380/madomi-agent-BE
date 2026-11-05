import { extraerMontosArsEnTexto } from '../../src/asistente/commerce/validarRespuestaComercial.js';

const FRASES_FALLBACK_ERROR = [
  'inconveniente técnico',
  'problema momentáneo',
  'me demoré más de lo usual',
  'asistente no disponible',
  'no disponible en este momento',
];

const FRASES_PLANTILLA_CATALOGO = [
  'no encontré productos con ese nombre',
  'no tengo productos',
];

/**
 * @param {object} expect
 * @param {{
 *   respuesta: string,
 *   presupuestoId: string|null,
 *   latenciaMs: number,
 *   estadoLead?: string,
 *   toolCallsCount?: number,
 * }} resultado
 */
export function evaluarExpectativas(expect, resultado) {
  const errores = [];
  const respuesta = resultado.respuesta ?? '';
  const respLower = respuesta.toLowerCase();

  if (expect.respuestaContiene) {
    for (const frag of expect.respuestaContiene) {
      if (!respLower.includes(String(frag).toLowerCase())) {
        errores.push(`Falta en respuesta: "${frag}"`);
      }
    }
  }

  if (expect.respuestaContieneAny) {
    const ok = expect.respuestaContieneAny.some((frag) =>
      respLower.includes(String(frag).toLowerCase()),
    );
    if (!ok) {
      errores.push(
        `La respuesta no contiene ninguno de: ${expect.respuestaContieneAny.join(', ')}`,
      );
    }
  }

  if (expect.respuestaNoContiene) {
    for (const frag of expect.respuestaNoContiene) {
      if (respLower.includes(String(frag).toLowerCase())) {
        errores.push(`No debería aparecer: "${frag}"`);
      }
    }
  }

  if (expect.respuestaRegex) {
    const re = new RegExp(expect.respuestaRegex, 'i');
    if (!re.test(respuesta)) {
      errores.push(`Regex no coincide: /${expect.respuestaRegex}/`);
    }
  }

  if (expect.minRespuestaLength != null) {
    const len = respuesta.trim().length;
    if (len < expect.minRespuestaLength) {
      errores.push(`Respuesta muy corta (${len} < ${expect.minRespuestaLength} caracteres)`);
    }
  }

  if (expect.maxRespuestaLength != null) {
    const len = respuesta.trim().length;
    if (len > expect.maxRespuestaLength) {
      errores.push(`Respuesta muy larga (${len} > ${expect.maxRespuestaLength})`);
    }
  }

  if (expect.minToolCalls != null) {
    const n = resultado.toolCallsCount ?? 0;
    if (n < expect.minToolCalls) {
      errores.push(`toolCallsCount ${n} < mínimo ${expect.minToolCalls}`);
    }
  }

  if (expect.maxToolCalls != null) {
    const n = resultado.toolCallsCount ?? 0;
    if (n > expect.maxToolCalls) {
      errores.push(`toolCallsCount ${n} > máximo ${expect.maxToolCalls}`);
    }
  }

  if (expect.montoArsEnRespuesta) {
    const montos = extraerMontosArsEnTexto(respuesta);
    const tieneFormato =
      montos.length > 0 || /\$\s*[\d.]|\d[\d.,]*\s*ars\b/i.test(respuesta);
    if (!tieneFormato) {
      errores.push('Se esperaba un monto en ARS ($ o ARS) en la respuesta');
    }
  }

  if (expect.mencionaPrecioOStock) {
    const ok =
      extraerMontosArsEnTexto(respuesta).length > 0 ||
      /\b(precio|stock|disponib|ars|\$)/i.test(respuesta);
    if (!ok) {
      errores.push('Se esperaba mención de precio, monto o stock');
    }
  }

  if (expect.pideLocalidadOEnvio) {
    const ok = /\b(localidad|barrio|env[ií]o|zon[a]?|dónde|donde|entreg)/i.test(respuesta);
    if (!ok) {
      errores.push('Se esperaba pedir localidad, barrio o envío');
    }
  }

  if (expect.respuestaCatalogoONovedades) {
    const ok = /\b(novedad|nuevo|últim|ultim|lanz|producto|catálogo|catalogo|tenemos|ofrecemos|pastas)/i.test(
      respuesta,
    );
    if (!ok) {
      errores.push('Se esperaba respuesta de catálogo o novedades (sin atar a un SKU)');
    }
  }

  if (expect.reconoceCorreccionOMeta) {
    const ok = /\b(disculp|perd[oó]n|antes|confus|revis|equivo|error|ten[eí]s razón|razón)/i.test(
      respuesta,
    );
    if (!ok) {
      errores.push('Se esperaba reconocer corrección o meta-pregunta del cliente');
    }
  }

  if (expect.noFallbackError) {
    for (const frag of FRASES_FALLBACK_ERROR) {
      if (respLower.includes(frag)) {
        errores.push(`Fallback de error no esperado: "${frag}"`);
      }
    }
  }

  if (expect.noPlantillaSinCoincidencias) {
    for (const frag of FRASES_PLANTILLA_CATALOGO) {
      if (respLower.includes(frag)) {
        errores.push(`Plantilla rígida no esperada: "${frag}"`);
      }
    }
  }

  if (expect.presupuestoId === 'present' && !resultado.presupuestoId) {
    errores.push('Se esperaba presupuestoId en la respuesta');
  }
  if (expect.presupuestoId === 'absent' && resultado.presupuestoId) {
    errores.push(`presupuestoId inesperado: ${resultado.presupuestoId}`);
  }

  if (expect.maxLatenciaMs != null && resultado.latenciaMs > expect.maxLatenciaMs) {
    errores.push(
      `Latencia ${resultado.latenciaMs}ms > máximo ${expect.maxLatenciaMs}ms`,
    );
  }

  if (expect.estadoLead && resultado.estadoLead !== expect.estadoLead) {
    errores.push(`estadoLead: esperado ${expect.estadoLead}, obtuvo ${resultado.estadoLead}`);
  }

  return errores;
}
