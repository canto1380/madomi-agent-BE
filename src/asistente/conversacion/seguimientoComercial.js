import {
  actualizarLeadRepositorio,
  mergeDatosCapturadosLeadRepositorio,
} from '../../mongo/repositories/leads.repository.js';

export function detectarPreferenciaContacto(mensaje) {
  const m = mensaje.toLowerCase();
  if (/whatsapp|wtsp|wsp|por escrito/.test(m)) {
    return 'whatsapp';
  }
  if (/llamada|llamen|me llamen|tel[eé]fono|por tel/.test(m)) {
    return 'llamada';
  }
  return null;
}

export function mensajePideConfirmacionContacto(mensaje) {
  return /(?:se\s+contactan|me\s+contactan|me\s+llaman|van\s+a\s+llamar|van\s+a\s+escribir)/i.test(
    mensaje,
  );
}

/**
 * Persiste en el lead que el equipo debe contactar al cliente (visible en CRM).
 */
export async function registrarSeguimientoComercialLead(ctx, payload) {
  if (!ctx?.leadId) {
    return;
  }
  const seguimiento = {
    pendiente: true,
    motivo: payload.motivo ?? 'seguimiento_comercial',
    notas: payload.notas?.slice(0, 2000) ?? null,
    preferenciaCanal: payload.preferenciaCanal ?? null,
    actualizadoAt: new Date().toISOString(),
  };

  await mergeDatosCapturadosLeadRepositorio(ctx.leadId, { seguimientoComercial: seguimiento });
  await actualizarLeadRepositorio(ctx.leadId, {
    requiereContactoComercial: true,
    ultimoMensajeAt: new Date(),
    ...(payload.cuelloBotella ? { cuelloBotella: payload.cuelloBotella } : {}),
    ...(payload.estadoLead ? { estado: payload.estadoLead } : {}),
  });
}
