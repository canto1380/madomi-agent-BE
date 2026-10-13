import { prisma } from '../providers/prisma.js';
import { USUARIO_PUBLICO_SELECT } from '../utils/usuarioPublico.js';

export const listarUsuariosRepositorio = async ({ incluirInactivos = true } = {}) => {
  return prisma.usuarios.findMany({
    where: incluirInactivos ? undefined : { activo: true },
    select: USUARIO_PUBLICO_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};

export const buscarUsuarioPorIdRepositorio = async (id) => {
  return prisma.usuarios.findUnique({
    where: { id },
    select: USUARIO_PUBLICO_SELECT,
  });
};

export const buscarUsuarioPorEmailRepositorio = async (email) => {
  return prisma.usuarios.findUnique({ where: { email } });
};

export const crearUsuarioRepositorio = async (data) => {
  return prisma.usuarios.create({
    data,
    select: USUARIO_PUBLICO_SELECT,
  });
};

export const actualizarUsuarioRepositorio = async (id, data) => {
  return prisma.usuarios.update({
    where: { id },
    data,
    select: USUARIO_PUBLICO_SELECT,
  });
};

export const bajaLogicaUsuarioRepositorio = async (id) => {
  return prisma.usuarios.update({
    where: { id },
    data: { activo: false },
    select: USUARIO_PUBLICO_SELECT,
  });
};

export const reactivarUsuarioRepositorio = async (id) => {
  return prisma.usuarios.update({
    where: { id },
    data: { activo: true },
    select: USUARIO_PUBLICO_SELECT,
  });
};

export const cambiarRolUsuarioRepositorio = async (id, rolId) => {
  return prisma.usuarios.update({
    where: { id },
    data: { rolId },
    select: USUARIO_PUBLICO_SELECT,
  });
};

export const contarUsuariosPorRolRepositorio = async (rolId) => {
  return prisma.usuarios.count({ where: { rolId } });
};
