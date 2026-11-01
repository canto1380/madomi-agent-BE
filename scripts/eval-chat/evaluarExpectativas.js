/**
 * Valida la respuesta del último turno de un escenario.
 * @param {object} expect
 * @param {{ respuesta: string, presupuestoId: string|null, latenciaMs: number, estadoLead?: string }} resultado
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
