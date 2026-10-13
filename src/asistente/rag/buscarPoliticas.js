import { obtenerContextoVigenteRepositorio } from '../../mongo/repositories/empresaContextos.repository.js';

function puntuarChunk(texto, consulta) {
  const terminos = consulta
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (terminos.length === 0) {
    return 0;
  }
  const blob = texto.toLowerCase();
  return terminos.reduce((acc, term) => acc + (blob.includes(term) ? 1 : 0), 0);
}

export async function buscarPoliticasKeyword(empresaId, consulta, { topK = 4 } = {}) {
  const contexto = await obtenerContextoVigenteRepositorio(empresaId, 'politicas_entrega');
  if (!contexto?.chunks?.length) {
    return { encontrado: false, chunks: [], version: null };
  }

  const rankeados = contexto.chunks
    .map((chunk) => ({
      chunkId: chunk.chunkId,
      titulo: chunk.titulo,
      texto: chunk.texto,
      score: puntuarChunk(`${chunk.titulo} ${chunk.texto}`, consulta),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    encontrado: rankeados.length > 0,
    version: contexto.version,
    chunks: rankeados,
  };
}
