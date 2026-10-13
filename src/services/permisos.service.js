import { AppError } from '../errors/AppError.js';
import {
  listarPermisosRepositorio,
  buscarPermisoPorIdRepositorio,
  buscarPermisoPorCodigoRepositorio,
  crearPermisoRepositorio,
  actualizarPermisoRepositorio,
  eliminarPermisoRepositorio,
  contarRolesConPermisoRepositorio,
} from '../repositories/permisos.repository.js';

export const listarPermisosServicio = async () => {
  return listarPermisosRepositorio();
};

export const obtenerPermisoServicio = async (id) => {
  const permiso = await buscarPermisoPorIdRepositorio(id);
  if (!permiso) {
    throw new AppError('Permiso no encontrado', 404, 'NOT_FOUND');
  }
  return permiso;
};

export const crearPermisoServicio = async (data) => {
  const existente = await buscarPermisoPorCodigoRepositorio(data.codigo);
  if (existente) {
    throw new AppError('Ya existe un permiso con ese código', 409, 'CONFLICT');
  }
  return crearPermisoRepositorio(data);
};

export const actualizarPermisoServicio = async (id, data) => {
  const permiso = await buscarPermisoPorIdRepositorio(id);
  if (!permiso) {
    throw new AppError('Permiso no encontrado', 404, 'NOT_FOUND');
  }

  if (data.codigo && data.codigo !== permiso.codigo) {
    const existente = await buscarPermisoPorCodigoRepositorio(data.codigo);
    if (existente) {
      throw new AppError('Ya existe un permiso con ese código', 409, 'CONFLICT');
    }
  }

  return actualizarPermisoRepositorio(id, data);
};

export const eliminarPermisoServicio = async (id) => {
  const permiso = await buscarPermisoPorIdRepositorio(id);
  if (!permiso) {
    throw new AppError('Permiso no encontrado', 404, 'NOT_FOUND');
  }

  const rolesAsignados = await contarRolesConPermisoRepositorio(id);
  if (rolesAsignados > 0) {
    throw new AppError(
      'No se puede eliminar un permiso asignado a roles',
      409,
      'CONFLICT',
    );
  }

  await eliminarPermisoRepositorio(id);
  return { id };
};
