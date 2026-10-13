/**
 * Parte un Markdown en chunks por encabezados ## (spec EmpresaContexto).
 */
export function partirMarkdownPorSecciones(markdown) {
  const lineas = markdown.split('\n');
  const secciones = [];
  let tituloActual = 'Introducción';
  let buffer = [];

  const flush = () => {
    const texto = buffer.join('\n').trim();
    if (texto.length > 0) {
      secciones.push({ titulo: tituloActual, texto });
    }
    buffer = [];
  };

  for (const linea of lineas) {
    const match = linea.match(/^##\s+(.+?)\s*$/);
    if (match) {
      flush();
      tituloActual = match[1].trim();
      continue;
    }
    buffer.push(linea);
  }
  flush();

  return secciones.map((sec, index) => ({
    chunkId: `sec-${index + 1}`,
    titulo: sec.titulo,
    texto: sec.texto,
  }));
}
