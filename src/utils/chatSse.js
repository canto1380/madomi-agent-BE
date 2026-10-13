/**
 * Emite respuesta de chat como SSE (spec §6.4).
 */
export function aceptaChatSse(req) {
  const accept = req.headers.accept ?? '';
  return accept.includes('text/event-stream');
}

export function escribirEventoSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function fragmentarTextoParaStream(texto, tamano = 28) {
  if (!texto) {
    return [];
  }
  const partes = [];
  const palabras = texto.split(/(\s+)/);
  let buffer = '';

  for (const token of palabras) {
    if ((buffer + token).length > tamano && buffer.trim()) {
      partes.push(buffer);
      buffer = token;
    } else {
      buffer += token;
    }
  }
  if (buffer) {
    partes.push(buffer);
  }
  return partes.length ? partes : [texto];
}

export async function enviarRespuestaChatComoSse(res, dto, { respuestaTexto }) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    for (const chunk of fragmentarTextoParaStream(respuestaTexto)) {
      escribirEventoSse(res, 'delta', { text: chunk });
    }
    escribirEventoSse(res, 'done', dto);
    res.end();
  } catch (err) {
    escribirEventoSse(res, 'error', {
      code: 'INTERNAL_ERROR',
      message: err.message ?? 'Error al enviar respuesta',
    });
    res.end();
  }
}
