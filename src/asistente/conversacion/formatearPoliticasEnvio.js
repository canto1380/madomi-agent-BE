function limpiarMarkdown(texto) {
  if (!texto) {
    return '';
  }
  return texto
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function oracionUtil(texto, maxLen = 280) {
  const limpio = limpiarMarkdown(texto);
  if (!limpio) {
    return '';
  }
  const cortado = limpio.slice(0, maxLen);
  const ultimoPunto = cortado.lastIndexOf('.');
  if (ultimoPunto > 80) {
    return cortado.slice(0, ultimoPunto + 1);
  }
  return cortado;
}

function chunksDesdeResultados(politicasTool, envioTool) {
  const deEnvio = envioTool?.result?.politicas?.chunks;
  if (deEnvio?.length) {
    return deEnvio;
  }
  return politicasTool?.result?.chunks ?? [];
}

function elegirChunksRelevantes(chunks) {
  const util = chunks.filter((c) => {
    const t = `${c.titulo ?? ''} ${c.texto ?? ''}`.toLowerCase();
    return !/qu[eé]\s+cubre\s+este\s+documento|índice|tabla\s+de\s+contenido/.test(t);
  });

  const ordenados = [...(util.length ? util : chunks)].sort((a, b) => {
    const score = (c) => {
      const t = `${c.titulo ?? ''} ${c.texto ?? ''}`.toLowerCase();
      let s = 0;
      if (/env[ií]o|entrega|zona|localidad|costo|plazo|retiro/.test(t)) {
        s += 3;
      }
      if (/capital|gran\s+tucum[aá]n|cord[oó]n/.test(t)) {
        s += 1;
      }
      return s;
    };
    return score(b) - score(a);
  });

  return ordenados.slice(0, 2);
}

/**
 * Texto conversacional para consultas de envío (sin volcar markdown de políticas).
 */
export function formatearRespuestaEnvio({ politicasTool, envioTool, intencionCosto = false }) {
  const chunks = elegirChunksRelevantes(chunksDesdeResultados(politicasTool, envioTool));
  const extractos = chunks
    .map((c) => oracionUtil(c.texto ?? c.titulo ?? '', 220))
    .filter(Boolean);

  const intro = intencionCosto
    ? 'El costo de envío depende de la zona y el monto del pedido.'
    : 'Sí, hacemos entregas en Tucumán y alrededores, según zona y día habilitado.';

  const cuerpo =
    extractos.length > 0
      ? extractos.join(' ')
      : 'Coordinamos día y horario con logística; también podés retirar en fábrica si te queda cómodo.';

  const cierre =
    'Contame en qué barrio o localidad estás y, si querés avanzar, un teléfono o WhatsApp para confirmarte el detalle.';

  return `${intro} ${cuerpo} ${cierre}`;
}
