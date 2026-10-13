/**
 * E2E catálogo chat: casos fijos alineados a docs/productos.md (orquestador).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

process.env.ASISTENTE_RUNTIME = process.env.ASISTENTE_RUNTIME || 'orchestrador';
process.env.CURSOR_SDK_REDACT = 'false';
process.env.ASISTENTE_REDACT = 'none';

const { connectMongo, disconnectMongo } = await import('../src/mongo/connection.js');
await import('../src/mongo/models/index.js');
const { initializeDatabase } = await import('../src/startup/database.js');
const { prisma } = await import('../src/providers/prisma.js');
const { enviarMensajeChatServicio } = await import('../src/services/chat.service.js');
const { env } = await import('../src/config/env.js');
const { extraerBusquedaProductoDesdeMensaje } = await import(
  '../src/asistente/intent/busquedaProducto.js'
);

/** @type {{ id: string, nombre: string, categoria: string, mensaje: string, assertRespuesta: (texto: string) => void }[]} */
const CASOS = [
  {
    id: '5000',
    nombre: 'Bondiola desmechada a la BBQ',
    categoria: 'Bondiola',
    mensaje: 'Hola, ¿qué productos de ravioles tienen?',
    assertRespuesta: (texto) => {
      if (!/ravioles/i.test(texto)) {
        throw new Error('Se esperaba listar productos Bondiola');
      }
      if (/no encontr[eé] productos/i.test(texto)) {
        throw new Error('No debería fallar la búsqueda por categoría Bondiola');
      }
    },
  },
  {
    id: '5000',
    nombre: 'Bondiola desmechada a la BBQ',
    categoria: 'Bondiola',
    mensaje: '¿Cuánto sale el paquete de bondiola desmechada?',
    assertRespuesta: (texto) => {
      if (!/bondiola|bondiola desmechada/i.test(texto)) {
        throw new Error('Se esperaba mención de bondiola/bondiola desmechada');
      }
    },
  },
  {
    id: '5000',
    nombre: 'Bondiola desmechada a la BBQ',
    categoria: 'Ravioles',
    mensaje: 'Quiero presupuesto por 2 unidades del producto 5000',
    assertRespuesta: (texto) => {
      if (!/presupuesto|5000|total/i.test(texto)) {
        throw new Error('Se esperaba respuesta de presupuesto borrador');
      }
    },
  },
];

function assertBusquedaUnitaria() {
  const { terminoPrincipal } = extraerBusquedaProductoDesdeMensaje(
    'Hola, ¿qué productos de ravioles tienen?',
  );
  if (!terminoPrincipal || !/ravioles/i.test(terminoPrincipal)) {
    throw new Error(`terminoPrincipal debe incluir ravioles, obtuvo ${terminoPrincipal}`);
  }
}

async function main() {
  console.log('=== E2E chat productos (docs/productos.md) ===\n');
  if (!env.FEATURE_ASISTENTE) {
    throw new Error('FEATURE_ASISTENTE debe ser true');
  }

  assertBusquedaUnitaria();
  console.log('✓ extraerBusquedaProductoDesdeMensaje (ravioles)\n');

  await initializeDatabase();
  await connectMongo();

  for (const caso of CASOS) {
    const sessionAnonimaId = randomUUID();
    console.log(`--- ${caso.id} ${caso.nombre} ---`);
    console.log('mensaje:', caso.mensaje);
    const data = await enviarMensajeChatServicio({
      sessionAnonimaId,
      mensaje: caso.mensaje,
      metadata: { canal: 'e2e' },
    });
    console.log('presupuestoId:', data.presupuestoId);
    console.log('respuesta:', `${data.respuesta.slice(0, 400)}...\n`);
    caso.assertRespuesta(data.respuesta);
    if (caso.mensaje.includes('presupuesto')) {
      if (!data.presupuestoId) {
        throw new Error('presupuestoId esperado en caso presupuesto');
      }
    }
    console.log('✓ ok\n');
  }

  console.log('✅ E2E productos completado.');
}

main()
  .catch((err) => {
    console.error('\n❌ E2E productos falló:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
    await prisma.$disconnect();
  });
