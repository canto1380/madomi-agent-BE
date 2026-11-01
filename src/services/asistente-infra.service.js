import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { isMongoHabilitado, getEstadoMongo } from '../mongo/connection.js';
import { buscarEmpresaPorSlugRepositorio } from '../mongo/repositories/empresas.repository.js';
import {
  listarContextosRepositorio,
  obtenerContextoVigenteRepositorio,
} from '../mongo/repositories/empresaContextos.repository.js';
import {
  actualizarAsistenteBotRepositorio,
  obtenerAsistenteBotPorEmpresaRepositorio,
} from '../mongo/repositories/asistenteBots.repository.js';
import { resumenAgenteRunsRepositorio } from '../mongo/repositories/agenteRuns.repository.js';
import { isStorageConfigured } from './storage.service.js';
import { obtenerEstadoChatPublicoServicio } from './chat-public.service.js';

function asegurarMongoActivo() {
  if (!isMongoHabilitado()) {
    throw new AppError('Módulo asistente deshabilitado', 503, 'ASISTENTE_DISABLED');
  }
  if (getEstadoMongo() !== 'connected') {
    throw new AppError('MongoDB no conectado', 503, 'MONGO_UNAVAILABLE');
  }
}

async function obtenerEmpresaOperativa() {
  const empresa = await buscarEmpresaPorSlugRepositorio(env.ASISTENTE_EMPRESA_SLUG);
  if (!empresa) {
    throw new AppError('Empresa no configurada en CRM', 404, 'NOT_FOUND');
  }
  return empresa;
}

function mapearContextoAdmin(doc) {
  if (!doc) {
    return null;
  }
  return {
    id: String(doc._id),
    tipo: doc.tipo,
    version: doc.version,
    hash: doc.hash,
    vigenteDesde: doc.vigenteDesde,
    vigenteHasta: doc.vigenteHasta,
    chunksCount: doc.chunks?.length ?? 0,
    origenPdfUrl: doc.origenPdfUrl,
    createdAt: doc.createdAt,
  };
}

export function obtenerEstadoAsistenteServicio() {
  return {
    featureAsistente: isMongoHabilitado(),
    mongo: getEstadoMongo(),
    empresaSlug: env.ASISTENTE_EMPRESA_SLUG,
  };
}

export async function obtenerEmpresaAsistenteAdminServicio() {
  asegurarMongoActivo();
  const empresa = await obtenerEmpresaOperativa();
  const bot = await obtenerAsistenteBotPorEmpresaRepositorio(empresa._id);
  return {
    id: String(empresa._id),
    slug: empresa.slug,
    nombre: empresa.nombre,
    moneda: empresa.moneda,
    vigenciaPresupuestoHoras: empresa.vigenciaPresupuestoHoras,
    asistenteBot: bot
      ? {
          nombre: bot.nombre,
          modelo: bot.modelo,
          activo: bot.activo,
          toolsHabilitadas: bot.toolsHabilitadas,
          systemPromptVersion: bot.systemPromptVersion,
        }
      : null,
  };
}

export async function listarContextosAdminServicio(query = {}) {
  asegurarMongoActivo();
  const empresa = await obtenerEmpresaOperativa();
  const docs = await listarContextosRepositorio(empresa._id, {
    tipo: query.tipo,
    limit: Number(query.limit) || 20,
  });
  return docs.map(mapearContextoAdmin);
}

export async function actualizarAsistenteBotAdminServicio(rawBody) {
  asegurarMongoActivo();
  const { activo } = rawBody;
  const empresa = await obtenerEmpresaOperativa();
  const existente = await obtenerAsistenteBotPorEmpresaRepositorio(empresa._id);
  if (!existente) {
    throw new AppError('Bot no configurado. Ejecutá db:seed:mongo', 404, 'NOT_FOUND');
  }
  const bot = await actualizarAsistenteBotRepositorio(empresa._id, { activo });
  return {
    nombre: bot.nombre,
    modelo: bot.modelo,
    activo: bot.activo,
    toolsHabilitadas: bot.toolsHabilitadas,
    systemPromptVersion: bot.systemPromptVersion,
  };
}

export async function obtenerSaludRuntimeAsistenteAdminServicio({ horasMetricas = 24 } = {}) {
  asegurarMongoActivo();
  const empresa = await obtenerEmpresaOperativa();
  const bot = await obtenerAsistenteBotPorEmpresaRepositorio(empresa._id);
  const widget = await obtenerEstadoChatPublicoServicio();
  const metricas = await resumenAgenteRunsRepositorio({ horas: horasMetricas });

  return {
    entorno: env.NODE_ENV,
    featureAsistente: env.FEATURE_ASISTENTE,
    runtime: env.ASISTENTE_RUNTIME,
    llmProveedor: env.ASISTENTE_LLM_PROVEEDOR,
    cursorCloud: env.CURSOR_AGENT_TARGET === 'cloud' && Boolean(env.CURSOR_API_KEY),
    openaiConfigurado: Boolean(env.OPENAI_API_KEY),
    pdfStorage: isStorageConfigured(),
    chatTurnTimeoutMs: env.CHAT_TURN_TIMEOUT_MS,
    rateLimit: {
      ventanaMs: env.CHAT_RATE_LIMIT_WINDOW_MS,
      max: env.CHAT_RATE_LIMIT_MAX,
    },
    empresaSlug: empresa.slug,
    bot: bot
      ? {
          nombre: bot.nombre,
          activo: bot.activo,
          modeloSeed: bot.modelo,
          systemPromptVersion: bot.systemPromptVersion,
          toolsHabilitadasCount: bot.toolsHabilitadas?.length ?? 0,
        }
      : null,
    widgetPublico: {
      disponible: widget.disponible,
      codigo: widget.codigo,
    },
    metricasAgenteRuns: metricas,
    checklist: {
      listoParaWidget: widget.disponible && Boolean(bot?.activo),
      accionesSiNoDisponible: widget.codigo ?? null,
    },
  };
}

export async function obtenerContextoVigenteAdminServicio(tipo) {
  asegurarMongoActivo();
  if (!tipo) {
    throw new AppError('Query tipo es obligatorio', 400, 'VALIDATION_ERROR');
  }
  const empresa = await obtenerEmpresaOperativa();
  const doc = await obtenerContextoVigenteRepositorio(empresa._id, tipo);
  if (!doc) {
    throw new AppError('No hay contexto vigente para ese tipo', 404, 'NOT_FOUND');
  }
  return {
    ...mapearContextoAdmin(doc),
    markdown: doc.markdown,
    chunks: doc.chunks,
  };
}
