import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });
process.env.ASISTENTE_REDACT = 'none';

const { initializeDatabase } = await import('../src/startup/database.js');
const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
await initializeDatabase();
await connectMongo();

const { ejecutarOrchestradorAsistente } = await import('../src/asistente/loop/orchestradorLoop.js');
const { obtenerEmpresaOperativa, obtenerBotActivoPorEmpresa } = await import('../src/asistente/runtimeGuards.js');
const { resolverToolsHabilitadas } = await import('../src/asistente/tools/index.js');
const { crearConversacionRepositorio } = await import('../src/mongo/repositories/conversaciones.repository.js');
const { crearLeadRepositorio } = await import('../src/mongo/repositories/leads.repository.js');

const empresa = await obtenerEmpresaOperativa();
const bot = await obtenerBotActivoPorEmpresa(empresa._id);
const lead = await crearLeadRepositorio({ empresaId: empresa._id, estado: 'nuevo', datosCapturados: {} });
const conv = await crearConversacionRepositorio({
  empresaId: empresa._id,
  sessionAnonimaId: randomUUID(),
  leadId: lead._id,
  canal: 'test',
  mensajes: [],
  metadata: {},
});

const ctx = { empresaId: empresa._id, leadId: lead._id, conversacionId: conv._id, clienteId: null };
const tools = resolverToolsHabilitadas(bot.toolsHabilitadas ?? []);
const mensaje = '10 unidades de bondiola y 15 de guiso de lenteja';

const r = await ejecutarOrchestradorAsistente({
  empresa,
  bot,
  tools,
  historialMensajes: [{ rol: 'user', contenido: mensaje }],
  ctx,
  conversacionId: conv._id,
  contextoChat: {},
});

console.log('tools:', r.toolCallsCount);
console.log('presupuestoId', r.presupuestoId);
console.log('estado', JSON.stringify(r.contextoChat, null, 2));

await disconnectMongo();
