import { env } from '../config/env.js';
import { isMongoHabilitado, getEstadoMongo } from '../mongo/connection.js';
import { buscarEmpresaPorSlugRepositorio } from '../mongo/repositories/empresas.repository.js';
import { obtenerAsistenteBotPorEmpresaRepositorio } from '../mongo/repositories/asistenteBots.repository.js';

function runtimeConfigurado() {
  if (env.ASISTENTE_RUNTIME === 'openai' && !env.OPENAI_API_KEY) {
    return false;
  }
  if (env.ASISTENTE_RUNTIME === 'cursor' && env.CURSOR_SDK_REDACT && !env.CURSOR_API_KEY) {
    return false;
  }
  return true;
}

export async function obtenerEstadoChatPublicoServicio() {
  if (!isMongoHabilitado()) {
    return { disponible: false, codigo: 'ASISTENTE_DISABLED' };
  }
  if (getEstadoMongo() !== 'connected') {
    return { disponible: false, codigo: 'MONGO_UNAVAILABLE' };
  }
  if (!runtimeConfigurado()) {
    return { disponible: false, codigo: 'ASISTENTE_NO_DISPONIBLE' };
  }

  const empresa = await buscarEmpresaPorSlugRepositorio(env.ASISTENTE_EMPRESA_SLUG);
  if (!empresa) {
    return { disponible: false, codigo: 'EMPRESA_NO_CONFIGURADA' };
  }

  const bot = await obtenerAsistenteBotPorEmpresaRepositorio(empresa._id);
  if (!bot || !bot.activo) {
    return {
      disponible: false,
      codigo: 'BOT_INACTIVO',
      nombreBot: bot?.nombre ?? null,
    };
  }

  return {
    disponible: true,
    codigo: null,
    nombreBot: bot.nombre,
    mensajeBienvenida:
      '¡Hola! Soy el asistente de Madomi Pastas. Puedo ayudarte con productos, precios, envíos y armar un presupuesto. ¿En qué te ayudo?',
  };
}
