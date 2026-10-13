import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../config/env.js';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const defaultPromptPath = path.join(backendRoot, '../docs/comercial/prompt-asistente-madomi.md');

let cachedPromptRaw = null;
let cachedPromptPath = null;

function resolverRutaPrompt() {
  const custom = env.ASISTENTE_PROMPT_PATH?.trim();
  if (!custom) {
    return defaultPromptPath;
  }
  return path.isAbsolute(custom) ? custom : path.join(backendRoot, custom);
}

function cargarPromptRaw() {
  const ruta = resolverRutaPrompt();
  if (cachedPromptRaw !== null && cachedPromptPath === ruta) {
    return cachedPromptRaw;
  }
  if (!fs.existsSync(ruta)) {
    cachedPromptPath = ruta;
    cachedPromptRaw = '';
    return cachedPromptRaw;
  }
  cachedPromptPath = ruta;
  cachedPromptRaw = fs.readFileSync(ruta, 'utf8');
  return cachedPromptRaw;
}

/** Invalida caché (tests o recarga en dev). */
export function invalidarCachePromptMadomi() {
  cachedPromptRaw = null;
  cachedPromptPath = null;
}

/**
 * Prompt maestro tipo “OpenAI Assistant”: identidad, tono, límites y reglas conversacionales.
 * Si falta el archivo, devuelve null y el caller puede usar fallback corto (systemV1).
 */
export function loadMadomiPrompt({ empresa, bot }) {
  const raw = cargarPromptRaw();
  if (!raw?.trim()) {
    return null;
  }
  const nombre = empresa?.nombre ?? 'Madomi Pastas';
  const moneda = empresa?.moneda ?? 'ARS';
  const vigencia = empresa?.vigenciaPresupuestoHoras ?? 48;
  const version = bot?.systemPromptVersion ?? 'madomi-comercial-v1';

  return raw
    .replace(/\{\{EMPRESA_NOMBRE\}\}/g, nombre)
    .replace(/\{\{MONEDA\}\}/g, moneda)
    .replace(/\{\{VIGENCIA_PRESUPUESTO_HORAS\}\}/g, String(vigencia))
    .replace(/\{\{PROMPT_VERSION\}\}/g, version);
}

export function buildSystemPromptConFallback({ empresa, bot }) {
  const maestro = loadMadomiPrompt({ empresa, bot });
  if (maestro) {
    return maestro;
  }
  return null;
}

/**
 * Prompt corto para redacción en chat (no enviar 20k+ tokens a Cursor/OpenAI por mensaje).
 * Las reglas completas siguen en docs/comercial/prompt-asistente-madomi.md (runtime openai).
 */
export function loadMadomiPromptRedaccion({ empresa, bot }) {
  const nombre = empresa?.nombre ?? 'Madomi Pastas';
  const version = bot?.systemPromptVersion ?? 'madomi-comercial-v1';

  return `Sos el asistente virtual oficial de ${nombre} (pastas frescas, Tucumán). Versión guía: ${version}.

Comunicación: español argentino, cercano, claro, breve, resolutivo. Emojis moderados (😊 🍝). No presiones al cliente.

Reglas críticas:
- Entender intención antes de buscar productos; un saludo no es búsqueda.
- Usá SOLO los "Datos verificados" del turno para precios, stock, productos, envíos y plazos.
- Nunca inventes ni pegues markdown crudo de políticas: resumí en lenguaje natural.
- Mantené continuidad con el historial ("el segundo", "¿cuánto sale?", nombre del cliente).
- No digas que consultaste tools ni expongas JSON interno.

Tu tarea en este paso: redactar la respuesta final al cliente a partir del borrador interno y los hechos verificados.`;
}
