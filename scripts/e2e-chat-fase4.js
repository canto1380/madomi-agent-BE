/**
 * E2E fase 4: presupuesto con precios Postgres, PDF (si Supabase), cierre (opcional).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

process.env.ASISTENTE_RUNTIME = 'orchestrador';
process.env.CURSOR_SDK_REDACT = 'false';
process.env.ASISTENTE_REDACT = 'none';

const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
const { initializeDatabase } = await import('../src/startup/database.js');
const { prisma } = await import('../src/providers/prisma.js');
const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');
const { env } = await import('../src/config/env.js');
const { isSupabaseConfigured } = await import('../src/services/storage.service.js');

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

async function main() {
  console.log('=== E2E chat fase 4 ===\n');
  if (!env.FEATURE_ASISTENTE) {
    throw new Error('FEATURE_ASISTENTE debe ser true');
  }

  await initializeDatabase();
  await connectMongo();

  const session = randomUUID();

  const t1 = await enviarMensajeChatServicio({
    sessionAnonimaId: session,
    mensaje: 'Quiero presupuesto por 2 unidades del producto 5000',
    metadata: { canal: 'e2e' },
  });
  console.log('Turno presupuesto — total en respuesta:', t1.respuesta.match(/\$[\d.,]+/g));
  assert(t1.presupuestoId, 'presupuestoId requerido');
  assert(t1.estadoLead === 'presupuesto_abierto', `estadoLead ${t1.estadoLead}`);
  assert(
    /Total estimado:\*\* \$[1-9]/.test(t1.respuesta) || /\$[1-9][\d.,]+ ARS/.test(t1.respuesta),
    'Se esperaba total > 0 (precios comerciales en Postgres)',
  );

  const t2 = await enviarMensajeChatServicio({
    sessionAnonimaId: session,
    mensaje: 'Generá el PDF del presupuesto',
    metadata: { canal: 'e2e' },
  });
  if (isSupabaseConfigured()) {
    assert(/Link:|pdf|http/i.test(t2.respuesta), 'Respuesta debe incluir link PDF');
    assert(t2.estadoLead === 'presupuesto_enviado', `estadoLead ${t2.estadoLead}`);
  } else {
    console.log('(Supabase no configurado — se omite assert PDF)');
  }

  console.log('\n✅ E2E fase 4 (presupuesto + PDF condicional) completado.');
}

main()
  .catch((err) => {
    console.error('\n❌ E2E fase 4 falló:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
    await prisma.$disconnect();
  });
