export const SECCION_NUEVO = 'lo_ultimo';
export const SECCION_DESTACADO = 'destacado';

export function extraerFlagsDestacados(destacados = []) {
  const activos = destacados.filter((d) => d.activo);
  return {
    esNuevo: activos.some((d) => d.seccion === SECCION_NUEVO),
    esDestacado: activos.some((d) => d.seccion === SECCION_DESTACADO),
  };
}
