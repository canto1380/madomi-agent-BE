/**
 * Genera un PDF de muestra en disco (layout vectorial Madomi v1).
 * node scripts/preview-pdf-presupuesto.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const { initializeDatabase } = await import('../src/startup/database.js');
const { renderPresupuestoPdfBuffer } = await import('../src/asistente/presupuesto/renderPresupuestoPdf.js');
const { obtenerContextoPdfPresupuesto } = await import('../src/asistente/presupuesto/obtenerContextoPdf.js');

await initializeDatabase();

const lineaMuestra = {
  productoId: 'preview',
  nombreSnapshot: 'Descripcion',
  unidad: 'un',
  precioUnitarioSnapshot: 1000.23,
  subtotalLinea: 1000.23,
};
const presupuesto = {
  _id: 'preview000000000000000001',
  moneda: 'ARS',
  validezHasta: new Date(Date.now() + 10 * 24 * 3600 * 1000),
  subtotal: 4000.92,
  costoEnvio: 0,
  total: 4421.02,
  items: [
    { ...lineaMuestra, cantidad: 4 },
    { ...lineaMuestra, cantidad: 6 },
    { ...lineaMuestra, cantidad: 4 },
    { ...lineaMuestra, cantidad: 6 },
  ],
};

const cliente = {
  nombre: 'Alejandro',
  apellido: 'Peñalba',
  telefono: '(381) 123-4567',
  email: 'cliente@ejemplo.test',
  direccion: 'San Martín 100',
  localidad: 'San Miguel de Tucumán',
  departamento: 'Capital',
  provincia: 'Tucumán',
};

const contextoPdf = await obtenerContextoPdfPresupuesto();
if (!contextoPdf.ivaPorcentaje) {
  contextoPdf.ivaPorcentaje = 10.5;
}
if (contextoPdf.datosPago?.lineas?.length === 1) {
  contextoPdf.datosPago = {
    lineas: ['Cuenta: XXXXXX', contextoPdf.empresaNombre ?? 'Madomi Pastas'],
  };
}
const buffer = await renderPresupuestoPdfBuffer({ presupuesto, cliente, contextoPdf });
const out = path.join(backendRoot, 'tmp', 'presupuesto-preview.pdf');
await writeFile(out, buffer);
console.log('PDF generado:', out);
