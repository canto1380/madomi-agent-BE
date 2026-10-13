import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError.js';
import { authConfig } from '../config/auth.config.js';
import {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  calcularExpiracionRefresh,
} from '../utils/jwt.js';
import { buscarRolPorNombreRepositorio } from '../repositories/roles.repository.js';
import {
  buscarUsuarioPorEmailRepositorio,
  buscarUsuarioPorIdPublicoRepositorio,
  crearUsuarioAuthRepositorio,
  crearRefreshTokenRepositorio,
  buscarRefreshTokenRepositorio,
  eliminarRefreshTokenRepositorio,
} from '../repositories/auth.repository.js';

const asegurarUsuarioActivo = (usuario) => {
  if (!usuario || !usuario.activo) {
    throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }
};

const emitirTokens = async (usuario) => {
  const accessToken = generarAccessToken({ sub: usuario.id, email: usuario.email });
  const refreshToken = generarRefreshToken({ sub: usuario.id });

  await crearRefreshTokenRepositorio({
    token: refreshToken,
    usuarioId: usuario.id,
    expiresAt: calcularExpiracionRefresh(),
  });

  return {
    accessToken,
    refreshToken,
    usuario,
  };
};

export const registrarServicio = async ({ email, clave, nombre, apellido }) => {
  const existente = await buscarUsuarioPorEmailRepositorio(email);
  if (existente) {
    throw new AppError('Ya existe un usuario con ese email', 409, 'CONFLICT');
  }

  const rol = await buscarRolPorNombreRepositorio(authConfig.rolDefault);
  if (!rol) {
    throw new AppError(
      `Rol por defecto "${authConfig.rolDefault}" no encontrado. Configure AUTH_ROL_DEFAULT.`,
      500,
      'CONFIG_ERROR',
    );
  }

  const claveEncriptada = await bcrypt.hash(clave, authConfig.bcryptRounds);

  const usuario = await crearUsuarioAuthRepositorio({
    email,
    claveEncriptada,
    nombre,
    apellido,
    rolId: rol.id,
    activo: true,
  });

  return emitirTokens(usuario);
};

export const loginServicio = async ({ email, clave }) => {
  const usuario = await buscarUsuarioPorEmailRepositorio(email);
  if (!usuario) {
    throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  asegurarUsuarioActivo(usuario);

  const claveValida = await bcrypt.compare(clave, usuario.claveEncriptada);
  if (!claveValida) {
    throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  const usuarioPublico = await buscarUsuarioPorIdPublicoRepositorio(usuario.id);
  return emitirTokens(usuarioPublico);
};

export const refreshServicio = async ({ refreshToken }) => {
  let payload;
  try {
    payload = verificarRefreshToken(refreshToken);
  } catch {
    throw new AppError('Refresh token inválido o expirado', 401, 'UNAUTHORIZED');
  }

  const registro = await buscarRefreshTokenRepositorio(refreshToken);
  if (!registro) {
    throw new AppError('Refresh token revocado', 401, 'UNAUTHORIZED');
  }

  if (registro.expiresAt < new Date()) {
    await eliminarRefreshTokenRepositorio(refreshToken);
    throw new AppError('Refresh token expirado', 401, 'UNAUTHORIZED');
  }

  if (payload.sub !== registro.usuarioId) {
    throw new AppError('Refresh token inválido', 401, 'UNAUTHORIZED');
  }

  asegurarUsuarioActivo(registro.usuario);

  const accessToken = generarAccessToken({
    sub: registro.usuario.id,
    email: registro.usuario.email,
  });

  return {
    accessToken,
    refreshToken,
    usuario: registro.usuario,
  };
};

export const logoutServicio = async ({ refreshToken }) => {
  if (refreshToken) {
    await eliminarRefreshTokenRepositorio(refreshToken);
  }
  return { ok: true };
};

export const obtenerUsuarioActualServicio = async (usuarioId) => {
  const usuario = await buscarUsuarioPorIdPublicoRepositorio(usuarioId);
  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }
  asegurarUsuarioActivo(usuario);
  return usuario;
};
