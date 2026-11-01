import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../../config/env.js';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const defaultPath = path.join(backendRoot, 'docs/comercial/prompt-agente-clientes-ia-runtime.md');

let cached = null;
let cachedPath = null;

function resolverRuta() {
  const custom = env.ASISTENTE_AGENTE_RUNTIME_PROMPT_PATH?.trim();
  if (!custom) {
    return defaultPath;
  }
  return path.isAbsolute(custom) ? custom : path.join(backendRoot, custom);
}

export function loadReglasRuntimeAgenteClientesIa() {
  const ruta = resolverRuta();
  if (cached !== null && cachedPath === ruta) {
    return cached;
  }
  cachedPath = ruta;
  if (!fs.existsSync(ruta)) {
    cached = REGLAS_INLINE;
    return cached;
  }
  cached = fs.readFileSync(ruta, 'utf8');
  return cached;
}

const REGlas_INLINE = `# Runtime agente-clientes-ia

- Usá tools para precios, stock, catálogo, envíos y datos del lead. Nunca inventes montos.
- Mantené el hilo: usá los productoId del bloque "Estado de sesión" para referencias ("el segundo", "esos productos").
- Cuando el cliente indique cantidades, llamá calcularPresupuesto con productoId y cantidad. Si falta localidad para envío, pedila y registrá con actualizarLead.
- Cuando tengas ítems y localidad, llamá calcularPresupuesto; el sistema puede completar el PDF automáticamente.
- No prometas que "el equipo te llama" si ya generaste presupuesto/PDF: compartí el link.
- requiereContactoComercial en CRM es para el dueño; al cliente ofrecé presupuesto concreto o derivación honesta si falta un precio mayorista.
- cerrarVenta solo si el cliente confirma explícitamente la compra.
`;
