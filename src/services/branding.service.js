import { AppError } from '../errors/AppError.js';
import { mapearBrandingPublico, mapearContenidoPublico } from '../utils/contenidoMapper.js';
import { obtenerBrandingActivoRepositorio, obtenerBrandingRepositorio, actualizarBrandingRepositorio } from '../repositories/branding.repository.js';
import { listarContenidoActivoRepositorio } from '../repositories/contenido.repository.js';

function mapearBrandingAdmin(b) {
  return {
    id: b.id,
    colorPrimario: b.colorPrimario,
    colorPrimarioOscuro: b.colorPrimarioOscuro,
    colorSecundario: b.colorSecundario,
    colorAcento: b.colorAcento,
    colorFondo: b.colorFondo,
    colorFondoOscuro: b.colorFondoOscuro,
    colorTexto: b.colorTexto,
    colorTextoClaro: b.colorTextoClaro,
    colorError: b.colorError,
    colorExito: b.colorExito,
    logoUrl: b.logoUrl,
    logoAlt: b.logoAlt,
    activo: b.activo,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export async function obtenerBrandingPublicoServicio() {
  const [branding, textos] = await Promise.all([
    obtenerBrandingActivoRepositorio(),
    listarContenidoActivoRepositorio(),
  ]);

  const contenido = mapearContenidoPublico(textos);
  return mapearBrandingPublico(branding, contenido);
}

export async function obtenerBrandingAdminServicio() {
  const branding = await obtenerBrandingRepositorio();
  if (!branding) throw new AppError('Configuración de branding no encontrada', 404, 'NOT_FOUND');
  return mapearBrandingAdmin(branding);
}

export async function actualizarBrandingServicio(data) {
  const branding = await obtenerBrandingRepositorio();
  if (!branding) throw new AppError('Configuración de branding no encontrada', 404, 'NOT_FOUND');

  const actualizado = await actualizarBrandingRepositorio(data);
  return mapearBrandingAdmin(actualizado);
}
