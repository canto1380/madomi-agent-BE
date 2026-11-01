import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const required = ['DATABASE_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable de entorno requerida: ${key}`);
  }
}

function parseBooleanEnv(value) {
  return String(value).toLowerCase() === 'true';
}

function parseBooleanEnvDefaultFalse(value) {
  if (value === undefined || value === '') {
    return false;
  }
  return parseBooleanEnv(value);
}

const FEATURE_ASISTENTE = parseBooleanEnv(process.env.FEATURE_ASISTENTE);

if (FEATURE_ASISTENTE && !process.env.MONGODB_URI?.trim()) {
  throw new Error('Variable de entorno requerida con FEATURE_ASISTENTE=true: MONGODB_URI');
}

const ASISTENTE_RUNTIME = (process.env.ASISTENTE_RUNTIME?.trim() || 'agente-clientes-ia').toLowerCase();

function resolverAsistenteRedactDefault() {
  const explicit = process.env.ASISTENTE_REDACT?.trim();
  if (explicit) {
    return explicit.toLowerCase();
  }
  if (process.env.OPENAI_API_KEY?.trim() || process.env.CURSOR_API_KEY?.trim()) {
    return 'auto';
  }
  return 'none';
}

const RUNTIMES_AGENTE_CLIENTES = new Set([
  'agente-clientes-ia',
  'agente-clientes',
  'openai',
  'cursor',
]);
function resolverAsistenteLlmProveedorDefault() {
  const explicit = process.env.ASISTENTE_LLM_PROVEEDOR?.trim().toLowerCase();
  if (explicit === 'openai' || explicit === 'cursor') {
    return explicit;
  }
  return 'auto';
}
const ASISTENTE_LLM_PROVEEDOR = resolverAsistenteLlmProveedorDefault();

if (FEATURE_ASISTENTE && RUNTIMES_AGENTE_CLIENTES.has(ASISTENTE_RUNTIME)) {
  const tieneCursor =
    process.env.CURSOR_API_KEY?.trim() && (process.env.CURSOR_AGENT_TARGET?.trim() || 'cloud') === 'cloud';
  const tieneOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());
  const ok =
    ASISTENTE_LLM_PROVEEDOR === 'cursor'
      ? tieneCursor
      : ASISTENTE_LLM_PROVEEDOR === 'openai'
        ? tieneOpenAi
        : tieneCursor || tieneOpenAi;
  if (!ok) {
    console.warn(
      `⚠️  ASISTENTE_RUNTIME=${ASISTENTE_RUNTIME} requiere CURSOR_API_KEY (cloud, recomendado) u OPENAI_API_KEY — POST /api/chat responderá 503.`,
    );
  }
}

function resolverStorageDriver() {
  const explicito = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (explicito === 'local' || explicito === 'supabase') return explicito;
  if (explicito) {
    throw new Error(`STORAGE_DRIVER inválido: "${explicito}". Usá supabase o local.`);
  }
  return (process.env.NODE_ENV || 'development') === 'production' ? 'local' : 'supabase';
}

const STORAGE_DRIVER = resolverStorageDriver();

function resolverDirectorioStorageLocal() {
  const crudo = process.env.STORAGE_LOCAL_DIR?.trim();
  if (!crudo) return path.join(backendRoot, 'uploads');
  return path.isAbsolute(crudo) ? path.resolve(crudo) : path.resolve(backendRoot, crudo);
}

function resolverBasePublicaStorage() {
  const crudo = process.env.STORAGE_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') || '';
  if (crudo) return crudo;
  if (STORAGE_DRIVER === 'local' && (process.env.NODE_ENV || 'development') !== 'production') {
    const port = Number(process.env.PORT) || 4000;
    return `http://localhost:${port}`;
  }
  return '';
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SUPABASE_URL: process.env.SUPABASE_URL?.trim() || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'madomi-media',
  /** supabase (default fuera de producción) | local (default con NODE_ENV=production). */
  STORAGE_DRIVER,
  STORAGE_LOCAL_DIR: resolverDirectorioStorageLocal(),
  STORAGE_PUBLIC_BASE_URL: resolverBasePublicaStorage(),
  /** Ruta HTTP donde Express publica el disco local. El proxy debe reenviar este prefijo a Node. */
  STORAGE_PUBLIC_PREFIX: '/api/uploads',
  FEATURE_ASISTENTE,
  MONGODB_URI: process.env.MONGODB_URI?.trim() || '',
  ASISTENTE_EMPRESA_SLUG: process.env.ASISTENTE_EMPRESA_SLUG?.trim() || 'madomi',
  ASISTENTE_RUNTIME,
  /** auto | cursor | openai — loop LLM de agente-clientes-ia (default auto = Cursor cloud si hay key). */
  ASISTENTE_LLM_PROVEEDOR,
  CURSOR_API_KEY: process.env.CURSOR_API_KEY?.trim() || '',
  CURSOR_MODEL: process.env.CURSOR_MODEL?.trim() || 'composer-2.5',
  /**
   * cloud = único soportado para redacción SDK en chat.
   * local = agente SQLite/CLI (no usar en POST /api/chat).
   */
  CURSOR_AGENT_TARGET: (process.env.CURSOR_AGENT_TARGET?.trim() || 'cloud').toLowerCase(),
  CURSOR_RUN_TIMEOUT_MS: Number(process.env.CURSOR_RUN_TIMEOUT_MS) || 90_000,
  /** true = tras orquestador, llamar Agent.prompt cloud. Default false (estable). */
  CURSOR_SDK_REDACT: parseBooleanEnvDefaultFalse(process.env.CURSOR_SDK_REDACT),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim() || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini',
  CHAT_RATE_LIMIT_WINDOW_MS: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 60_000,
  CHAT_RATE_LIMIT_MAX: Number(process.env.CHAT_RATE_LIMIT_MAX) || 20,
  CHAT_HISTORIAL_MAX_MENSAJES: Number(process.env.CHAT_HISTORIAL_MAX_MENSAJES) || 40,
  /** Timeout total por mensaje en agente-clientes-ia (ms). */
  CHAT_TURN_TIMEOUT_MS: Number(process.env.CHAT_TURN_TIMEOUT_MS) || 90_000,
  /** Reescribe respuesta del orquestador con OpenAI (tono humano). Requiere OPENAI_API_KEY. */
  ASISTENTE_REDACT_OPENAI: parseBooleanEnvDefaultFalse(process.env.ASISTENTE_REDACT_OPENAI),
  /**
   * Redacción final con prompt maestro: auto | openai | cursor | none.
   * auto = OpenAI si hay key; si runtime=cursor prioriza Cursor; si no, Cursor si hay key.
   */
  ASISTENTE_REDACT: resolverAsistenteRedactDefault(),
  /** Ruta al prompt editable (default: backend/docs/comercial/prompt-asistente-madomi.md). */
  ASISTENTE_PROMPT_PATH: process.env.ASISTENTE_PROMPT_PATH?.trim() || '',
  /** Reglas runtime agente-clientes-ia (default backend/docs/comercial/prompt-agente-clientes-ia-runtime.md). */
  ASISTENTE_AGENTE_RUNTIME_PROMPT_PATH: process.env.ASISTENTE_AGENTE_RUNTIME_PROMPT_PATH?.trim() || '',
  /** Timeout redacción LLM en orquestador (ms). Pasado esto se usa el borrador ya emitido. */
  ASISTENTE_REDACT_TIMEOUT_MS: Number(process.env.ASISTENTE_REDACT_TIMEOUT_MS) || 28_000,
  /**
   * Al cerrar venta (cerrarVenta): comprometer | descontar | ninguno.
   * comprometer (default) = stockComprometidoUnidades hasta entrega/cancelación.
   */
  ASISTENTE_STOCK_AL_CERRAR: (process.env.ASISTENTE_STOCK_AL_CERRAR?.trim() || 'comprometer').toLowerCase(),
  /** @deprecated Usar ASISTENTE_STOCK_AL_CERRAR=descontar */
  ASISTENTE_DECREMENTAR_STOCK: parseBooleanEnvDefaultFalse(process.env.ASISTENTE_DECREMENTAR_STOCK),
  /** JSON opcional: overrides parciales de layoutMadomiV1 (coordenadas puntos PDF). */
  PRESUPUESTO_PDF_LAYOUT: process.env.PRESUPUESTO_PDF_LAYOUT?.trim() || '',
  PRESUPUESTO_PDF_DATOS_PAGO: process.env.PRESUPUESTO_PDF_DATOS_PAGO?.trim() || '',
  PRESUPUESTO_PDF_CONDICIONES: process.env.PRESUPUESTO_PDF_CONDICIONES?.trim() || '',
  PRESUPUESTO_PDF_OTROS_DETALLES: process.env.PRESUPUESTO_PDF_OTROS_DETALLES?.trim() || '',
  PRESUPUESTO_PDF_IVA_PORCENTAJE: process.env.PRESUPUESTO_PDF_IVA_PORCENTAJE?.trim() || '',
  PRESUPUESTO_PDF_SITIO_WEB: process.env.PRESUPUESTO_PDF_SITIO_WEB?.trim() || '',
};
