import { USUARIO_PUBLICO_SELECT } from './usuarioPublico.js';

export { USUARIO_PUBLICO_SELECT };

/**
 * Aplana permisos del rol a `permisosCodigos` para middleware y frontend.
 */
export function mapearUsuarioPublico(usuario) {
  if (!usuario) {
    return null;
  }

  const permisosCodigos =
    usuario.rol?.permisos?.map((rp) => rp.permiso?.codigo).filter(Boolean) ?? [];

  const { permisos: _rolPermisos, ...rolResto } = usuario.rol ?? {};

  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rolId: usuario.rolId,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
    rol: usuario.rol ? rolResto : null,
    permisosCodigos,
  };
}
