import { Conversacion } from '../models/Conversacion.js';

export async function buscarConversacionPorSessionRepositorio(empresaId, sessionAnonimaId) {
  return Conversacion.findOne({ empresaId, sessionAnonimaId }).lean();
}

export async function buscarConversacionPorIdRepositorio(conversacionId, empresaId) {
  return Conversacion.findOne({ _id: conversacionId, empresaId }).lean();
}

export async function crearConversacionRepositorio(datos) {
  const doc = await Conversacion.create(datos);
  return doc.toObject();
}

export async function agregarMensajeConversacionRepositorio(conversacionId, mensaje) {
  return Conversacion.findByIdAndUpdate(
    conversacionId,
    {
      $push: { mensajes: mensaje },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' },
  ).lean();
}

export async function guardarCursorAgentIdRepositorio(conversacionId, cursorAgentId) {
  return Conversacion.findByIdAndUpdate(
    conversacionId,
    { $set: { 'metadata.cursorAgentId': cursorAgentId } },
    { returnDocument: 'after' },
  ).lean();
}

export async function guardarContextoChatRepositorio(conversacionId, contextoChat) {
  return Conversacion.findByIdAndUpdate(
    conversacionId,
    { $set: { 'metadata.contextoChat': contextoChat, updatedAt: new Date() } },
    { returnDocument: 'after' },
  ).lean();
}

export async function vincularLeadClienteConversacionRepositorio(conversacionId, { leadId, clienteId }) {
  const update = {};
  if (leadId) {
    update.leadId = leadId;
  }
  if (clienteId) {
    update.clienteId = clienteId;
  }
  return Conversacion.findByIdAndUpdate(conversacionId, { $set: update }, { returnDocument: 'after' }).lean();
}
