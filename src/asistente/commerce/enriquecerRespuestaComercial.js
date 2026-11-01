import { normalizarTextoRespuestaChat } from '../agentes/agenteClientesIa/normalizarTextoRespuestaChat.js';

/**
 * Si el kernel generó PDF y el modelo no lo mencionó, agregar link explícito.
 */
export function enriquecerRespuestaComercial(respuesta, { pdfUrl, totalPresupuesto, moneda = 'ARS' }) {
  let texto = normalizarTextoRespuestaChat(respuesta?.trim() || '');
  if (!texto) {
    texto = 'Disculpá, no pude generar una respuesta. ¿Podés repetir?';
  }

  if (pdfUrl && !texto.includes(pdfUrl)) {
    const totalTxt =
      totalPresupuesto != null ? ` por $${totalPresupuesto} ${moneda}` : '';
    texto += `\n\nListo, te armé el presupuesto${totalTxt}. Podés verlo acá: ${pdfUrl}\n\nEl link queda guardado en esta conversación. Para confirmar la compra, escribí que confirmás el pedido o escribinos por WhatsApp con ese PDF.`;
  }

  return texto;
}
