/**
 * Venta punta a punta — producto 5000 (presupuesto → PDF → cierre → stock comprometido).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

process.env.ASISTENTE_RUNTIME = 'orchestrador';

const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
const { initializeDatabase } = await import('../src/startup/database.js');
const { prisma } = await import('../src/providers/prisma.js');
const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');
const { env } = await import('../src/config/env.js');
const { obtenerProductoComercialPorIdRepositorio } = await import(
  '../src/repositories/productos.repository.js'
);
const { calcularStockDisponible } = await import('../src/asistente/stock/stockComercial.js');
const { actualizarLeadTool } = await import('../src/asistente/tools/actualizarLead.js');
const { buscarEmpresaPorSlugRepositorio } = await import('../src/mongo/repositories/empresas.repository.js');
const { isStorageConfigured } = await import('../src/services/storage.service.js');

const PRODUCTO_ID = '5000';
const CANTIDAD = 2;

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

async function main() {
  console.log('=== E2E venta punta a punta (producto 5000) ===\n');
  if (!env.FEATURE_ASISTENTE) {
    throw new Error('FEATURE_ASISTENTE=true');
  }

  await initializeDatabase();
  await connectMongo();

  const antes = await obtenerProductoComercialPorIdRepositorio(PRODUCTO_ID);
  assert(antes, `Producto ${PRODUCTO_ID} no encontrado o inactivo comercialmente`);
  const dispAntes = calcularStockDisponible(antes);
  console.log('Stock 5000 — físico:', antes.stockUnidades, 'comprometido:', antes.stockComprometidoUnidades ?? 0);
  console.log('Disponible antes:', dispAntes, '\n');

  const session = randomUUID();
  const empresa = await buscarEmpresaPorSlugRepositorio(env.ASISTENTE_EMPRESA_SLUG);

  console.log('1) Presupuesto 2×5000');
  const t1 = await enviarMensajeChatServicio({
    sessionAnonimaId: session,
    mensaje: `Quiero presupuesto por ${CANTIDAD} unidades del producto ${PRODUCTO_ID}`,
    metadata: { canal: 'e2e' },
  });
  console.log('   presupuestoId:', t1.presupuestoId, '| lead:', t1.leadId);
  assert(t1.presupuestoId, 'Falta presupuestoId');
  assert(t1.estadoLead === 'presupuesto_abierto', t1.estadoLead);

  console.log('\n2) Datos cliente (tool actualizarLead)');
  await actualizarLeadTool.execute(
    {
      nombre: 'Cliente',
      apellido: 'Prueba E2E',
      email: 'e2e-venta@ejemplo.test',
      telefono: '+5493815000000',
      direccion: 'Calle Falsa 123',
      localidad: 'San Miguel de Tucumán',
      departamento: 'Capital',
      provincia: 'Tucumán',
    },
    {
      empresaId: empresa._id,
      leadId: t1.leadId,
      conversacionId: t1.conversacionId,
      clienteId: t1.clienteId,
    },
  );

  console.log('\n3) Generar PDF');
  const t2 = await enviarMensajeChatServicio({
    sessionAnonimaId: session,
    mensaje: 'Generá el PDF del presupuesto',
    metadata: { canal: 'e2e' },
  });
  if (isStorageConfigured()) {
    assert(/Link:|http/i.test(t2.respuesta), 'Debe incluir link PDF');
    console.log('   PDF OK (storage configurado)');
  } else {
    console.log('   ⚠ Storage no configurado — PDF omitido');
  }

  console.log('\n4) Confirmar compra (cerrarVenta)');
  const t3 = await enviarMensajeChatServicio({
    sessionAnonimaId: session,
    mensaje: 'Confirmo la compra',
    metadata: { canal: 'e2e' },
  });
  console.log('   pedidoId:', t3.pedidoId, '| estadoLead:', t3.estadoLead);
  assert(t3.pedidoId, 'Falta pedidoId');
  assert(t3.estadoLead === 'pedido_cerrado', t3.estadoLead);

  const despues = await obtenerProductoComercialPorIdRepositorio(PRODUCTO_ID);
  const dispDespues = calcularStockDisponible(despues);
  console.log('\nStock después — físico:', despues.stockUnidades, 'comprometido:', despues.stockComprometidoUnidades ?? 0);
  console.log('Disponible después:', dispDespues);

  if (env.ASISTENTE_STOCK_AL_CERRAR === 'comprometer' || !env.ASISTENTE_DECREMENTAR_STOCK) {
    assert(
      (despues.stockComprometidoUnidades ?? 0) >= (antes.stockComprometidoUnidades ?? 0) + CANTIDAD,
      'Debe comprometerse stock al cerrar',
    );
    assert(dispDespues === dispAntes - CANTIDAD, `Disponible debió bajar ${CANTIDAD}`);
  }

  console.log('\n✅ Venta E2E producto 5000 completada.');
}

main()
  .catch((err) => {
    console.error('\n❌ E2E venta falló:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
    await prisma.$disconnect();
  });
