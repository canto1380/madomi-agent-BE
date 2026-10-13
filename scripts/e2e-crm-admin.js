/**
 * Smoke test servicios CRM admin (Mongo + permisos de datos, sin HTTP/JWT).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
const { env } = await import('../src/config/env.js');
const {
  statsResumenCrmServicio,
  statsCuelloBotellaCrmServicio,
  listarLeadsAdminServicio,
  listarPresupuestosAdminServicio,
  listarPedidosAdminServicio,
} = await import('../src/services/crm.service.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('=== E2E CRM admin (servicios) ===\n');
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI requerida');
  }

  await connectMongo();

  const resumen = await statsResumenCrmServicio();
  assert(typeof resumen.totalLeads === 'number', 'stats resumen: totalLeads');
  assert(resumen.embudo && typeof resumen.embudo === 'object', 'stats resumen: embudo');
  console.log('Stats resumen — leads:', resumen.totalLeads, 'embudo keys:', Object.keys(resumen.embudo).length);

  const cuello = await statsCuelloBotellaCrmServicio();
  assert(Array.isArray(cuello.porCuelloBotella), 'stats cuello: porCuelloBotella');
  console.log('Stats cuello — filas:', cuello.porCuelloBotella.length);

  const leads = await listarLeadsAdminServicio({ page: 1, limit: 5 });
  assert(Array.isArray(leads.items), 'leads.items');
  console.log('Leads listados:', leads.items.length, 'de', leads.paginacion?.total ?? '?');

  const presup = await listarPresupuestosAdminServicio({ page: 1, limit: 5 });
  assert(Array.isArray(presup.items), 'presupuestos.items');
  console.log('Presupuestos:', presup.items.length);

  const pedidos = await listarPedidosAdminServicio({ page: 1, limit: 5 });
  assert(Array.isArray(pedidos.items), 'pedidos.items');
  console.log('Pedidos:', pedidos.items.length);

  if (leads.items[0]?.id) {
    const porLead = await listarPresupuestosAdminServicio({ page: 1, limit: 5, leadId: leads.items[0].id });
    console.log('Filtro leadId OK — presupuestos para lead', leads.items[0].id, ':', porLead.items.length);
  }

  console.log('\nOK — CRM admin servicios operativos.');
  await disconnectMongo();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
