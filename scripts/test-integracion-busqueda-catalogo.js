/**
 * Integración: buscarProductos contra el catálogo real en Postgres.
 * No depende de un producto fijo: toma muestra de productos activos comercialmente
 * y verifica que search + tool los encuentren (contains + fuzzy del repositorio).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const { initializeDatabase } = await import('../src/startup/database.js');
const { buscarProductosTool } = await import('../src/asistente/tools/buscarProductos.js');
const { buscarProductosComercial } = await import(
  '../src/asistente/busqueda/buscarProductosComercial.js'
);
const { prisma } = await import('../src/providers/prisma.js');

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

/** Primer token usable del nombre (mín. 3 caracteres) para simular lo que diría un cliente. */
function terminoBusquedaDesdeNombre(nombre) {
  const tokens = String(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !/^(de|del|la|el|x|kg|un)$/i.test(t));
  return tokens[0] ?? nombre.slice(0, 6).toLowerCase();
}

try {
  await initializeDatabase();

  const muestra = await prisma.productos.findMany({
    where: { activo: true, activoComercial: true },
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    take: 8,
    select: { id: true, nombre: true, categoria: true },
  });

  assert(muestra.length >= 3, 'Se necesitan al menos 3 productos comerciales en DB (corré db:seed)');

  for (const producto of muestra) {
    const search = terminoBusquedaDesdeNombre(producto.nombre);
    const directo = await buscarProductosComercial({ search, limit: 15 });
    assert(
      directo.rows.some((r) => r.id === producto.id),
      `buscarProductosComercial: "${search}" no devolvió ${producto.id} (${producto.nombre})`,
    );

    const tool = await buscarProductosTool.execute({ search, limit: 15 }, {});
    assert(tool.status === 'coincidencias', `tool status=${tool.status} search="${search}"`);
    assert(
      tool.productos.some((p) => p.id === producto.id),
      `tool: "${search}" sin ${producto.id} (${producto.nombre})`,
    );
  }

  const listado = await buscarProductosTool.execute({ listarCatalogo: true, limit: 30 }, {});
  assert(listado.status === 'coincidencias', 'listarCatalogo sin coincidencias');
  assert(listado.productos.length >= muestra.length, 'listarCatalogo devolvió menos que la muestra DB');

  console.log('test-integracion-busqueda-catalogo: OK', {
    productosProbados: muestra.length,
    ids: muestra.map((p) => p.id),
  });
} catch (err) {
  console.error('test-integracion-busqueda-catalogo: FAIL', err.message ?? err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
