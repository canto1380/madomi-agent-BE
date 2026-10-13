import { env } from '../../config/env.js';
import { obtenerBrandingActivoRepositorio } from '../../repositories/branding.repository.js';
import { obtenerContactoActivoRepositorio } from '../../repositories/contacto.repository.js';
import { listarContenidoActivoRepositorio } from '../../repositories/contenido.repository.js';

export async function cargarLogoBuffer(logoUrl) {
  if (!logoUrl?.trim()) {
    return null;
  }
  let url = logoUrl.trim();
  if (url.startsWith('/')) {
    const base = env.CORS_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
    url = `${base}${url}`;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function obtenerContextoPdfPresupuesto() {
  const [branding, contacto, textos] = await Promise.all([
    obtenerBrandingActivoRepositorio(),
    obtenerContactoActivoRepositorio(),
    listarContenidoActivoRepositorio(),
  ]);
  const nombreEmpresa =
    textos.find((t) => t.clave === 'empresa.nombre')?.valor?.trim() || 'Madomi Pastas';

  const logoBuffer = branding?.logoUrl ? await cargarLogoBuffer(branding.logoUrl) : null;

  let datosPago = null;
  if (env.PRESUPUESTO_PDF_DATOS_PAGO?.trim()) {
    try {
      datosPago = JSON.parse(env.PRESUPUESTO_PDF_DATOS_PAGO);
    } catch {
      datosPago = { lineas: env.PRESUPUESTO_PDF_DATOS_PAGO.split('\n').filter(Boolean) };
    }
  }

  return {
    branding,
    contacto,
    logoBuffer,
    empresaNombre: nombreEmpresa,
    datosPago: datosPago ?? {
      lineas: ['Consultar medios de pago con ventas.'],
    },
    condicionesPago:
      env.PRESUPUESTO_PDF_CONDICIONES?.trim() ||
      'El pago debe efectuarse dentro de los 15 días posteriores al envío del presupuesto. Pasado ese plazo, los precios pueden actualizarse.',
    otrosDetalles:
      env.PRESUPUESTO_PDF_OTROS_DETALLES?.trim() ||
      'Presupuesto sujeto a disponibilidad de stock. Vigencia indicada en este documento.',
    ivaPorcentaje: Number(env.PRESUPUESTO_PDF_IVA_PORCENTAJE) || 0,
    sitioWeb: env.PRESUPUESTO_PDF_SITIO_WEB?.trim() || 'www.madomipastas.com',
  };
}
