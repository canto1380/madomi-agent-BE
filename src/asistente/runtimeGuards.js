import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { isMongoHabilitado, getEstadoMongo } from '../mongo/connection.js';
import { buscarEmpresaPorSlugRepositorio } from '../mongo/repositories/empresas.repository.js';
import { obtenerAsistenteBotPorEmpresaRepositorio } from '../mongo/repositories/asistenteBots.repository.js';

function validarCredencialesRuntime() {
  const runtimesAgente = new Set(['agente-clientes-ia', 'agente-clientes', 'openai', 'cursor']);
  if (runtimesAgente.has(env.ASISTENTE_RUNTIME)) {
    const prov = env.ASISTENTE_LLM_PROVEEDOR;
    if (prov === 'openai' && !env.OPENAI_API_KEY) {
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
    }
    if (prov === 'cursor' && !env.CURSOR_API_KEY) {
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
    }
    if (prov === 'auto' && !env.CURSOR_API_KEY && !env.OPENAI_API_KEY) {
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
    }
    return;
  }
  if (env.ASISTENTE_RUNTIME === 'orchestrador' && env.ASISTENTE_REDACT !== 'none') {
    const usaCursor = env.ASISTENTE_REDACT === 'cursor' || env.ASISTENTE_REDACT === 'auto';
    if (usaCursor && env.CURSOR_AGENT_TARGET === 'cloud' && !env.CURSOR_API_KEY) {
      throw new AppError('Asistente no disponible', 503, 'ASISTENTE_NO_DISPONIBLE');
    }
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
