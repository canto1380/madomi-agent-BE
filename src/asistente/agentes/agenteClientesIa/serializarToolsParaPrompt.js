/**
 * Catálogo de tools para el prompt (runtime Cursor sin function-calling nativo).
 */
export function serializarToolsParaPrompt(tools) {
  const lista = tools.map((t) => ({
    nombre: t.name,
    descripcion: t.description,
    parametros: t.parameters,
  }));
  return JSON.stringify(lista, null, 2);
}
