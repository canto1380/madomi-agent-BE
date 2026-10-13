import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { chatRateLimitMiddleware } from '../middlewares/chatRateLimit.middleware.js';
import { chatMensajeSchema } from '../validations/chat.validation.js';
import { enviarMensajeChat, obtenerEstadoChat } from '../controllers/chat.controller.js';
import { isMongoHabilitado } from '../mongo/connection.js';

const router = Router();

router.get('/estado', obtenerEstadoChat);

router.post(
  '/',
  (req, res, next) => {
    if (!isMongoHabilitado()) {
      return res.status(503).json({
        data: null,
        error: 'ASISTENTE_NO_DISPONIBLE',
        message: 'Asistente no disponible',
      });
    }
    return next();
  },
  chatRateLimitMiddleware,
  validate(chatMensajeSchema),
  enviarMensajeChat,
);

export default router;
