import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { isMongoHabilitado, getEstadoMongo } from '../mongo/connection.js';
import { buscarEmpresaPorSlugRepositorio } from '../mongo/repositories/empresas.repository.js';
import { obtenerAsistenteBotPorEmpresaRepositorio } from '../mongo/repositories/asistenteBots.repository.js';

function validarCredencialesRuntime() {
  if (env.ASISTENTE_RUNTIME === 'openai' && !env.OPENAI_API_KEY) {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
  if (
    env.ASISTENTE_RUNTIME === 'cursor' &&
    env.CURSOR_SDK_REDACT &&
    !env.CURSOR_API_KEY
  ) {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
}

export function asegurarAsistenteDisponible() {
  if (!isMongoHabilitado()) {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
  if (getEstadoMongo() !== 'connected') {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
  validarCredencialesRuntime();
}

export async function obtenerEmpresaOperativa() {
  const empresa = await buscarEmpresaPorSlugRepositorio(env.ASISTENTE_EMPRESA_SLUG);
  if (!empresa) {
    throw new AppError('Empresa no configurada en CRM', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
  return empresa;
}

export async function obtenerBotActivoPorEmpresa(empresaId) {
  const bot = await obtenerAsistenteBotPorEmpresaRepositorio(empresaId);
  if (!bot || !bot.activo) {
    throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
  }
  return bot;
}
