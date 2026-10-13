import { AppError } from '../errors/AppError.js';
import {
  listarRolesRepositorio,
  buscarRolPorIdRepositorio,
  buscarRolPorNombreRepositorio,
  crearRolRepositorio,
  actualizarRolRepositorio,
  eliminarRolRepositorio,
  sincronizarPermisosRolRepositorio,
} from '../repositories/roles.repository.js';
import { buscarPermisosPorIdsRepositorio } from '../repositories/permisos.repository.js';
import { contarUsuariosPorRolRepositorio } from '../repositories/usuarios.repository.js';

const formatearRol = (rol) => {
  if (!rol) return rol;
  const permisos = rol.permisos?.map((rp) => rp.permiso) ?? [];
  const { permisos: _, ...resto } = rol;
  return { ...resto, permisos };
};

export const listarRolesServicio = async () => {
  const roles = await listarRolesRepositorio();
  return roles.map(formatearRol);
};

export const obtenerRolServicio = async (id) => {
  const rol = await buscarRolPorIdRepositorio(id);
  if (!rol) {
    throw new AppError('Rol no encontrado', 404, 'NOT_FOUND');
  }
  return formatearRol(rol);
};

export const crearRolServicio = async (data) => {
  const existente = await buscarRolPorNombreRepositorio(data.nombre);
  if (existente) {
    throw new AppError('Ya existe un rol con ese nombre', 409, 'CONFLICT');
  }
  const rol = await crearRolRepositorio(data);
  return obtenerRolServicio(rol.id);
};

export const actualizarRolServicio = async (id, data) => {
  const rol = await buscarRolPorIdRepositorio(id);
  if (!rol) {
    throw new AppError('Rol no encontrado', 404, 'NOT_FOUND');
  }

  if (data.nombre && data.nombre !== rol.nombre) {
    const existente = await buscarRolPorNombreRepositorio(data.nombre);
    if (existente) {
      throw new AppError('Ya existe un rol con ese nombre', 409, 'CONFLICT');
    }
  }

  await actualizarRolRepositorio(id, data);
  return obtenerRolServicio(id);
};

export const eliminarRolServicio = async (id) => {
  const rol = await buscarRolPorIdRepositorio(id);
  if (!rol) {
    throw new AppError('Rol no encontrado', 404, 'NOT_FOUND');
  }

  const usuariosAsignados = await contarUsuariosPorRolRepositorio(id);
  if (usuariosAsignados > 0) {
    throw new AppError(
      'No se puede eliminar un rol con usuarios asignados',
      409,
      'CONFLICT',
    );
  }

  await eliminarRolRepositorio(id);
  return { id };
};

export const sincronizarPermisosRolServicio = async (id, permisoIds) => {
  const rol = await buscarRolPorIdRepositorio(id);
  if (!rol) {
    throw new AppError('Rol no encontrado', 404, 'NOT_FOUND');
  }

  if (permisoIds.length > 0) {
    const permisos = await buscarPermisosPorIdsRepositorio(permisoIds);
    if (permisos.length !== permisoIds.length) {
      throw new AppError('Uno o más permisos no existen', 400, 'VALIDATION_ERROR');
    }
  }

  const actualizado = await sincronizarPermisosRolRepositorio(id, permisoIds);
  return formatearRol(actualizado);
};
