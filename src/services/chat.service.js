import {
  asegurarAsistenteDisponible,
  obtenerEmpresaOperativa,
  obtenerBotActivoPorEmpresa,
} from '../asistente/runtimeGuards.js';
import { resolverToolsHabilitadas } from '../asistente/tools/index.js';
import { ejecutarLoopAsistente } from '../asistente/loop/llmLoop.js';
import {
  buscarConversacionPorSessionRepositorio,
  crearConversacionRepositorio,
  agregarMensajeConversacionRepositorio,
  guardarContextoChatRepositorio,
} from '../mongo/repositories/conversaciones.repository.js';
import { normalizarEstadoConversacion } from '../asistente/conversacion/estadoConversacion.js';
import {
  crearLeadRepositorio,
  actualizarLeadRepositorio,
  buscarLeadPorIdRepositorio,
} from '../mongo/repositories/leads.repository.js';
import { inferirAccionesDesdeLead } from '../asistente/accionesUi.js';

async function obtenerOCrearSesionChat(empresaId, sessionAnonimaId, metadata = {}) {
  const existente = await buscarConversacionPorSessionRepositorio(empresaId, sessionAnonimaId);
  if (existente) {
    const lead = await buscarLeadPorIdRepositorio(existente.leadId);
    return { conversacion: existente, lead };
  }

  const lead = await crearLeadRepositorio({
    empresaId,
    estado: 'nuevo',
    ultimoMensajeAt: new Date(),
    datosCapturados: {},
    productosInteres: [],
  });

  const conversacion = await crearConversacionRepositorio({
    empresaId,
    sessionAnonimaId,
    leadId: lead._id,
    clienteId: null,
    canal: metadata.canal ?? 'web_chat',
    mensajes: [],
    metadata: {},
  });

  await actualizarLeadRepositorio(lead._id, { conversacionIdActiva: conversacion._id });

  return {
    conversacion,
    lead: { ...lead, conversacionIdActiva: conversacion._id },
  };
}

export async function enviarMensajeChatServicio({ sessionAnonimaId, mensaje, metadata = {} }) {
  asegurarAsistenteDisponible();

  const empresa = await obtenerEmpresaOperativa();
  const bot = await obtenerBotActivoPorEmpresa(empresa._id);

  const { conversacion, lead } = await obtenerOCrearSesionChat(
    empresa._id,
    sessionAnonimaId,
    metadata,
  );

  const mensajeUsuario = {
    rol: 'user',
    contenido: mensaje,
    createdAt: new Date(),
  };

  let conversacionActual = await agregarMensajeConversacionRepositorio(
    conversacion._id,
    mensajeUsuario,
  );

  const tools = resolverToolsHabilitadas(bot.toolsHabilitadas ?? []);
  const ctx = {
    empresaId: empresa._id,
    leadId: lead._id,
    conversacionId: conversacion._id,
    clienteId: conversacionActual.clienteId ?? lead.clienteId ?? null,
    cursorAgentId: conversacionActual.metadata?.cursorAgentId ?? null,
  };

  const contextoChat = normalizarEstadoConversacion(conversacionActual.metadata?.contextoChat);

  const {
    respuesta,
    presupuestoId: presupuestoIdRuntime,
    pedidoId: pedidoIdRuntime,
    contextoChat: contextoChatActualizado,
  } = await ejecutarLoopAsistente({
    empresa,
    bot,
    tools,
    historialMensajes: conversacionActual.mensajes ?? [],
    ctx,
    conversacionId: conversacion._id,
    contextoChat,
  });

  if (contextoChatActualizado) {
    await guardarContextoChatRepositorio(conversacion._id, contextoChatActualizado);
  }

  const mensajeAsistente = {
    rol: 'assistant',
    contenido: respuesta,
    createdAt: new Date(),
  };

  conversacionActual = await agregarMensajeConversacionRepositorio(
    conversacion._id,
    mensajeAsistente,
  );

  await actualizarLeadRepositorio(lead._id, { ultimoMensajeAt: new Date() });

  let leadActualizado = await buscarLeadPorIdRepositorio(lead._id);
  if (leadActualizado.estado === 'nuevo') {
    await actualizarLeadRepositorio(lead._id, { estado: 'consultando' });
    leadActualizado = await buscarLeadPorIdRepositorio(lead._id);
  }

  return {
    conversacionId: String(conversacion._id),
    leadId: String(lead._id),
    clienteId: leadActualizado.clienteId ? String(leadActualizado.clienteId) : null,
    respuesta,
    estadoLead: leadActualizado.estado,
    presupuestoId: presupuestoIdRuntime ? String(presupuestoIdRuntime) : null,
    pedidoId: pedidoIdRuntime ? String(pedidoIdRuntime) : null,
    acciones: inferirAccionesDesdeLead(leadActualizado, presupuestoIdRuntime, pedidoIdRuntime),
  };
}
