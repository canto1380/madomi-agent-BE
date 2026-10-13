import { prisma } from '../providers/prisma.js';
import { USUARIO_PUBLICO_SELECT } from '../utils/usuarioPublico.js';
import { mapearUsuarioPublico } from '../utils/mapearUsuarioPublico.js';

export const buscarUsuarioPorEmailRepositorio = async (email) => {
  return prisma.usuarios.findUnique({ where: { email } });
};

export const buscarUsuarioPorIdPublicoRepositorio = async (id) => {
  const usuario = await prisma.usuarios.findUnique({
    where: { id },
    select: USUARIO_PUBLICO_SELECT,
  });
  return mapearUsuarioPublico(usuario);
};

export const crearUsuarioAuthRepositorio = async (data) => {
  const usuario = await prisma.usuarios.create({
    data,
    select: USUARIO_PUBLICO_SELECT,
  });
  return mapearUsuarioPublico(usuario);
};

export const crearRefreshTokenRepositorio = async ({ token, usuarioId, expiresAt }) => {
  return prisma.refreshToken.create({
    data: { token, usuarioId, expiresAt },
  });
};

export const buscarRefreshTokenRepositorio = async (token) => {
  const registro = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      usuario: {
        select: USUARIO_PUBLICO_SELECT,
      },
    },
  });
  if (!registro) {
    return null;
  }
  return {
    ...registro,
    usuario: mapearUsuarioPublico(registro.usuario),
  };
};

export const eliminarRefreshTokenRepositorio = async (token) => {
  return prisma.refreshToken.deleteMany({ where: { token } });
};

export const eliminarRefreshTokensPorUsuarioRepositorio = async (usuarioId) => {
  return prisma.refreshToken.deleteMany({ where: { usuarioId } });
};
