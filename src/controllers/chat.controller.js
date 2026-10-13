import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { enviarMensajeChatServicio } from '../services/chat.service.js';
import { obtenerEstadoChatPublicoServicio } from '../services/chat-public.service.js';
import {
  aceptaChatSse,
  escribirEventoSse,
  fragmentarTextoParaStream,
} from '../utils/chatSse.js';

const responderError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      data: null,
      error: error.code,
      message: error.message,
    });
  }
  throw error;
};

export const obtenerEstadoChat = asyncHandler(async (req, res) => {
  try {
    const data = await obtenerEstadoChatPublicoServicio();
    res.status(200).json({ data, error: null, message: null });
  } catch (error) {
    return responderError(res, error);
  }
});

export const enviarMensajeChat = asyncHandler(async (req, res) => {
  const sse = aceptaChatSse(req);
  try {
    const { sessionAnonimaId, mensaje, metadata } = req.validatedData;

    if (sse) {
      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      escribirEventoSse(res, 'status', { phase: 'typing' });
    }

    const data = await enviarMensajeChatServicio({
      sessionAnonimaId,
      mensaje,
      metadata,
    });

    if (sse) {
      const final = data.respuesta ?? '';
      for (const chunk of fragmentarTextoParaStream(final)) {
        escribirEventoSse(res, 'delta', { text: chunk });
      }
      escribirEventoSse(res, 'done', data);
      return res.end();
    }
    res.status(200).json({ data, error: null, message: null });
  } catch (error) {
    if (sse && !res.headersSent) {
      res.status(error instanceof AppError ? error.statusCode : 500);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      escribirEventoSse(res, 'error', {
        code: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
        message: error.message ?? 'Error en el asistente',
      });
      return res.end();
    }
    if (sse && res.headersSent) {
      escribirEventoSse(res, 'error', {
        code: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
        message: error.message ?? 'Error en el asistente',
      });
      return res.end();
    }
    return responderError(res, error);
  }
});
