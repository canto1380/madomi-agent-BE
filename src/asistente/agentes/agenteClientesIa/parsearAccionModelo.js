function extraerJson(texto) {
  const t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidato = fence?.[1]?.trim() ?? t;
  const start = candidato.indexOf('{');
  const end = candidato.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return null;
  }
  const slice = candidato.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    try {
      const reparado = slice
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(reparado);
    } catch {
      return null;
    }
  }
}

function parsearAccionResponderSueltos(texto) {
  const accionMatch = texto.match(/"accion"\s*:\s*"(responder|reply|respuesta)"/i);
  if (!accionMatch) {
    return null;
  }
  const textoMatch = texto.match(/"texto"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  if (textoMatch) {
    try {
      const dec = JSON.parse(`"${textoMatch[1]}"`);
      if (typeof dec === 'string' && dec.trim()) {
        return { tipo: 'respuesta', texto: dec.trim() };
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @returns {{ tipo: 'tools', llamadas: { nombre: string, args: object }[] } | { tipo: 'respuesta', texto: string } | { tipo: 'invalido', raw: string }}
 */
export function parsearAccionModelo(texto) {
  if (!texto?.trim()) {
    return { tipo: 'invalido', raw: texto ?? '' };
  }

  const parsed = extraerJson(texto);
  if (!parsed || typeof parsed !== 'object') {
    const suelto = parsearAccionResponderSueltos(texto);
    if (suelto) {
      return suelto;
    }
    const limpio = texto.trim();
    if (limpio.length >= 8 && !limpio.includes('{') && /[a-záéíóúñ]/i.test(limpio)) {
      return { tipo: 'respuesta', texto: limpio };
    }
    return { tipo: 'invalido', raw: texto };
  }

  const accion = parsed.accion ?? parsed.action ?? parsed.tipo;
  if (accion === 'tools' || accion === 'tool' || accion === 'llamar_tools') {
    const llamadas = parsed.llamadas ?? parsed.tool_calls ?? parsed.tools ?? [];
    if (!Array.isArray(llamadas) || !llamadas.length) {
      return { tipo: 'invalido', raw: texto };
    }
    const normalizadas = llamadas
      .map((l) => ({
        nombre: l.nombre ?? l.name ?? l.tool,
        args: l.args ?? l.arguments ?? l.parametros ?? {},
      }))
      .filter((l) => l.nombre);
    if (!normalizadas.length) {
      return { tipo: 'invalido', raw: texto };
    }
    return { tipo: 'tools', llamadas: normalizadas };
  }

  if (accion === 'responder' || accion === 'reply' || accion === 'respuesta') {
    const textoResp =
      parsed.texto ?? parsed.text ?? parsed.respuesta ?? parsed.message ?? parsed.content;
    if (typeof textoResp === 'string' && textoResp.trim()) {
      return { tipo: 'respuesta', texto: textoResp.trim() };
    }
    return { tipo: 'invalido', raw: texto };
  }

  return { tipo: 'invalido', raw: texto };
}
