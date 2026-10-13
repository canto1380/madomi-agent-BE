import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

export const generarAccessToken = ({ sub, email }) => {
  return jwt.sign({ sub, email }, authConfig.jwtSecret, {
    expiresIn: authConfig.accessTokenExpiresIn,
  });
};

export const generarRefreshToken = ({ sub }) => {
  return jwt.sign({ sub }, authConfig.jwtRefreshSecret, {
    expiresIn: authConfig.refreshTokenExpiresIn,
  });
};

export const verificarAccessToken = (token) => {
  return jwt.verify(token, authConfig.jwtSecret);
};

export const verificarRefreshToken = (token) => {
  return jwt.verify(token, authConfig.jwtRefreshSecret);
};

export const calcularExpiracionRefresh = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + authConfig.refreshTokenDays);
  return expiresAt;
};
