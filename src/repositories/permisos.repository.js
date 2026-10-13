import { prisma } from '../providers/prisma.js';

export const listarPermisosRepositorio = async () => {
  return prisma.permisos.findMany({
    orderBy: { codigo: 'asc' },
  });
};

export const buscarPermisoPorIdRepositorio = async (id) => {
  return prisma.permisos.findUnique({ where: { id } });
};

export const buscarPermisoPorCodigoRepositorio = async (codigo) => {
  return prisma.permisos.findUnique({ where: { codigo } });
};

export const crearPermisoRepositorio = async (data) => {
  return prisma.permisos.create({ data });
};

export const actualizarPermisoRepositorio = async (id, data) => {
  return prisma.permisos.update({ where: { id }, data });
};

export const eliminarPermisoRepositorio = async (id) => {
  return prisma.permisos.delete({ where: { id } });
};

export const buscarPermisosPorIdsRepositorio = async (ids) => {
  return prisma.permisos.findMany({ where: { id: { in: ids } } });
};

export const contarRolesConPermisoRepositorio = async (permisoId) => {
  return prisma.rolPermiso.count({ where: { permisoId } });
};
