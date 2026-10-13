import { prisma } from '../providers/prisma.js';

export const listarRolesRepositorio = async () => {
  return prisma.roles.findMany({
    include: {
      permisos: {
        include: {
          permiso: true,
        },
      },
      _count: { select: { usuarios: true } },
    },
    orderBy: { nombre: 'asc' },
  });
};

export const buscarRolPorIdRepositorio = async (id) => {
  return prisma.roles.findUnique({
    where: { id },
    include: {
      permisos: {
        include: {
          permiso: true,
        },
      },
      _count: { select: { usuarios: true } },
    },
  });
};

export const buscarRolPorNombreRepositorio = async (nombre) => {
  return prisma.roles.findUnique({ where: { nombre } });
};

export const crearRolRepositorio = async (data) => {
  return prisma.roles.create({ data });
};

export const actualizarRolRepositorio = async (id, data) => {
  return prisma.roles.update({ where: { id }, data });
};

export const eliminarRolRepositorio = async (id) => {
  return prisma.roles.delete({ where: { id } });
};

export const sincronizarPermisosRolRepositorio = async (rolId, permisoIds) => {
  return prisma.$transaction(async (tx) => {
    await tx.rolPermiso.deleteMany({ where: { rolId } });

    if (permisoIds.length > 0) {
      await tx.rolPermiso.createMany({
        data: permisoIds.map((permisoId) => ({ rolId, permisoId })),
        skipDuplicates: true,
      });
    }

    return tx.roles.findUnique({
      where: { id: rolId },
      include: {
        permisos: { include: { permiso: true } },
        _count: { select: { usuarios: true } },
      },
    });
  });
};

export const buscarRolesPorIdsRepositorio = async (ids) => {
  return prisma.roles.findMany({ where: { id: { in: ids } } });
};
