import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashContenido } from '../utils/contentHash.js';
import { partirMarkdownPorSecciones } from '../utils/markdownChunks.js';
import { upsertEmpresaPorSlugRepositorio } from '../mongo/repositories/empresas.repository.js';
import {
  buscarContextoPorHashRepositorio,
  cerrarContextosVigentesRepositorio,
  crearContextoRepositorio,
} from '../mongo/repositories/empresaContextos.repository.js';
import { upsertAsistenteBotRepositorio } from '../mongo/repositories/asistenteBots.repository.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLITICAS_MD = path.resolve(
  __dirname,
  '../../docs/comercial/politicas-entrega-ejemplo.md',
);

const TOOLS_INICIALES = [
  'buscarProductos',
  'consultarPrecio',
  'consultarStock',
  'calcularPresupuesto',
  'generarPresupuestoPdf',
  'consultarEnvio',
  'buscarPoliticas',
  'actualizarLead',
  'cerrarVenta',
];

export async function seedAsistenteMongo() {
  const slug = env.ASISTENTE_EMPRESA_SLUG;

  const empresa = await upsertEmpresaPorSlugRepositorio(slug, {
    nombre: 'Madomi Pastas',
    timezone: 'America/Argentina/Tucuman',
    moneda: 'ARS',
    vigenciaPresupuestoHoras: 72,
  });

  await upsertAsistenteBotRepositorio(empresa._id, {
    nombre: 'Asistente Madomi',
    modelo: 'orchestrador-v1',
    temperature: 0.4,
    systemPromptVersion: 'v1',
    toolsHabilitadas: TOOLS_INICIALES,
    activo: true,
  });

  const markdown = await readFile(POLITICAS_MD, 'utf8');
  const hash = hashContenido(markdown);
  const tipo = 'politicas_entrega';
  const version = '2026-09-23-ejemplo';

  const existente = await buscarContextoPorHashRepositorio(empresa._id, tipo, hash);
  if (existente) {
    console.log('[seed:mongo] EmpresaContexto políticas — sin cambios (hash igual).');
    return { empresa, contexto: existente, creado: false };
  }

  const ahora = new Date();
  await cerrarContextosVigentesRepositorio(empresa._id, tipo, ahora);

  const chunks = partirMarkdownPorSecciones(markdown);
  const contexto = await crearContextoRepositorio({
    empresaId: empresa._id,
    tipo,
    version,
    markdown,
    hash,
    origenPdfUrl: null,
    vigenteDesde: ahora,
    vigenteHasta: null,
    chunks,
  });

  console.log(
    `[seed:mongo] EmpresaContexto políticas publicado — ${chunks.length} chunks, version ${version}.`,
  );

  return { empresa, contexto, creado: true };
}
