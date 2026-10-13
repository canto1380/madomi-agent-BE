/** Select Prisma para respuestas API sin claveEncriptada */
export const USUARIO_PUBLICO_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rolId: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  rol: {
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      permisos: {
        select: {
          permiso: {
            select: { codigo: true },
          },
        },
      },
    },
  },
};

export const omitirClaveEncriptada = (usuario) => {
  if (!usuario) return usuario;
  const { claveEncriptada, ...resto } = usuario;
  return resto;
};
