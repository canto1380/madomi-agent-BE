/**
 * Saludo sin pedido comercial (playbook: responder cordial, sin tools).
 * No reemplaza al LLM en consultas de producto/precio — evita Cursor cloud en "hola".
 */
export function esTurnoSaludoPuro(mensajeUsuario) {
  const t = String(mensajeUsuario ?? '').trim();
  if (!t || t.length > 70) {
    return false;
  }

  const lower = t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (
    /\b(precio|precios|producto|productos|stock|envio|envío|presupuesto|pedido|cuanto|cuánto|cuesta|sale|catalogo|catálogo|novedad|fideo|raviole|ñoqui|guiso|bondiola|humita|\d)\b/.test(
      lower,
    )
  ) {
    return false;
  }

  return (
    /^(hola|holaa|holaaa|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal|qué tal)[\s!?,.]*$/i.test(
      t,
    ) || /^(hola|buenas)[,!.\s]*$/i.test(t)
  );
}

export function respuestaSaludoPuroAgente() {
  return '¡Hola! ¿En qué te ayudo? Podés preguntarme por productos, precios, envíos o armar un presupuesto.';
}
