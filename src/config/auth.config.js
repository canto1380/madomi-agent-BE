export const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  refreshTokenDays: 7,
  rolDefault: process.env.AUTH_ROL_DEFAULT || 'USUARIO',
  bcryptRounds: 12,
};

export const validarConfigAuth = () => {
  if (!authConfig.jwtSecret || !authConfig.jwtRefreshSecret) {
    throw new Error('JWT_SECRET y JWT_REFRESH_SECRET son obligatorios');
  }
};
