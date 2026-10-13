import { redactarAsistenteConLlm } from './redactarAsistenteConLlm.js';
import { resolverModoRedaccion } from './resolverModoRedaccion.js';

/** @deprecated Usar redactarAsistenteConLlm vía orquestador. Mantenido por compat. */
export async function pulirRespuestaConOpenAi(args) {
  const modo = resolverModoRedaccion();
  if (!modo) {
    return args.borrador;
  }
  return redactarAsistenteConLlm({
    ...args,
    resultadosTools: args.resultadosTools ?? [],
    estado: args.estado ?? {},
    intencion: args.intencion ?? null,
    provider: modo,
  });
}
