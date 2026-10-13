import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError.js';
import {
  listarUsuariosRepositorio,
  buscarUsuarioPorIdRepositorio,
  buscarUsuarioPorEmailRepositorio,
  crearUsuarioRepositorio,
  actualizarUsuarioRepositorio,
  bajaLogicaUsuarioRepositorio,
  reactivarUsuarioRepositorio,
  cambiarRolUsuarioRepositorio,
} from '../repositories/usuarios.repository.js';
import { buscarRolPorIdRepositorio } from '../repositories/roles.repository.js';

const BCRYPT_ROUNDS = 12;

const asegurarRolExiste = async (rolId) => {
  const rol = await buscarRolPorIdRepositorio(rolId);
  if (!rol) {
    throw new AppError('Rol no encontrado', 404, 'NOT_FOUND');
  }
  return rol;
};

const asegurarUsuarioExiste = async (id) => {
  const usuario = await buscarUsuarioPorIdRepositorio(id);
  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }
  return usuario;
};

export const listarUsuariosServicio = async (query = {}) => {
  const incluirInactivos = query.incluirInactivos !== 'false';
  return listarUsuariosRepositorio({ incluirInactivos });
};

export const obtenerUsuarioServicio = async (id) => {
  return asegurarUsuarioExiste(id);
};

export const crearUsuarioServicio = async (data) => {
  await asegurarRolExiste(data.rolId);

  const existente = await buscarUsuarioPorEmailRepositorio(data.email);
  if (existente) {
    throw new AppError('Ya existe un usuario con ese email', 409, 'CONFLICT');
  }

  const claveEncriptada = await bcrypt.hash(data.clave, BCRYPT_ROUNDS);

  return crearUsuarioRepositorio({
    email: data.email,
    claveEncriptada,
    nombre: data.nombre,
    apellido: data.apellido,
    rolId: data.rolId,
    activo: data.activo ?? true,
  });
};

export const actualizarUsuarioServicio = async (id, data) => {
  await asegurarUsuarioExiste(id);

  if (data.rolId) {
    await asegurarRolExiste(data.rolId);
  }

  if (data.email) {
    const existente = await buscarUsuarioPorEmailRepositorio(data.email);
    if (existente && existente.id !== id) {
      throw new AppError('Ya existe un usuario con ese email', 409, 'CONFLICT');
    }
  }

  const payload = { ...data };
  delete payload.clave;

  if (data.clave) {
    payload.claveEncriptada = await bcrypt.hash(data.clave, BCRYPT_ROUNDS);
  }

  return actualizarUsuarioRepositorio(id, payload);
};

export const eliminarUsuarioServicio = async (id) => {
  await asegurarUsuarioExiste(id);
  return bajaLogicaUsuarioRepositorio(id);
};

export const reactivarUsuarioServicio = async (id) => {
  await asegurarUsuarioExiste(id);
  return reactivarUsuarioRepositorio(id);
};

export const cambiarRolUsuarioServicio = async (id, rolId) => {
  await asegurarUsuarioExiste(id);
  await asegurarRolExiste(rolId);
  return cambiarRolUsuarioRepositorio(id, rolId);
};

export const resetearClaveUsuarioServicio = async (id, clave) => {
  await asegurarUsuarioExiste(id);
  const claveEncriptada = await bcrypt.hash(clave, BCRYPT_ROUNDS);
  return actualizarUsuarioRepositorio(id, { claveEncriptada });
};
