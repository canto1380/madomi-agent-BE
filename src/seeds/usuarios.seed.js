/**
 * Seeder idempotente del módulo Usuarios.
 * Ejecutar desde el proyecto destino con Prisma configurado.
 *
 * Uso:
 *   node backend/src/seeds/usuarios.seed.js
 * o importar seedUsuariosModulo() desde el seeder principal.
 */
import bcrypt from 'bcrypt';
import { PERMISOS_PANEL_SEED } from '../constants/permisos.js';

const BCRYPT_ROUNDS = 12;
const CLAVE_DESARROLLO = 'Desarrollo123!';

const PERMISOS_SEED = [
  { codigo: 'usuarios.ver', descripcion: 'Ver listado y detalle de usuarios' },
  { codigo: 'usuarios.crear', descripcion: 'Crear usuarios' },
  { codigo: 'usuarios.editar', descripcion: 'Editar usuarios' },
  { codigo: 'usuarios.eliminar', descripcion: 'Desactivar usuarios' },
  { codigo: 'roles.ver', descripcion: 'Ver roles' },
  { codigo: 'roles.crear', descripcion: 'Crear roles' },
  { codigo: 'roles.editar', descripcion: 'Editar roles' },
  { codigo: 'roles.eliminar', descripcion: 'Eliminar roles' },
  { codigo: 'permisos.ver', descripcion: 'Ver permisos' },
  { codigo: 'permisos.editar', descripcion: 'Editar permisos' },
  ...PERMISOS_PANEL_SEED,
];

const ROLES_SEED = [
  { nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
  { nombre: 'USUARIO', descripcion: 'Usuario estándar' },
];

const USUARIOS_SEED = [
  {
    email: 'admin@desarrollo.local',
    nombre: 'Admin',
    apellido: 'Desarrollo',
    rolNombre: 'ADMIN',
  },
  {
    email: 'usuario@desarrollo.local',
    nombre: 'Usuario',
    apellido: 'Prueba',
    rolNombre: 'USUARIO',
  },
];

export async function seedUsuariosModulo(prisma) {
  console.log('🌱 Seeder módulo Usuarios...');

  const claveEncriptada = await bcrypt.hash(CLAVE_DESARROLLO, BCRYPT_ROUNDS);

  for (const permiso of PERMISOS_SEED) {
    await prisma.permisos.upsert({
      where: { codigo: permiso.codigo },
      update: { descripcion: permiso.descripcion },
      create: permiso,
    });
  }

  const permisos = await prisma.permisos.findMany();
  const permisosPorCodigo = Object.fromEntries(permisos.map((p) => [p.codigo, p]));

  for (const rol of ROLES_SEED) {
    await prisma.roles.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion },
      create: rol,
    });
  }

  const roles = await prisma.roles.findMany();
  const rolesPorNombre = Object.fromEntries(roles.map((r) => [r.nombre, r]));

  const rolAdmin = rolesPorNombre.ADMIN;
  if (rolAdmin) {
    for (const permiso of permisos) {
      await prisma.rolPermiso.upsert({
        where: {
          rolId_permisoId: { rolId: rolAdmin.id, permisoId: permiso.id },
        },
        update: {},
        create: { rolId: rolAdmin.id, permisoId: permiso.id },
      });
    }
  }

  for (const usuario of USUARIOS_SEED) {
    const rol = rolesPorNombre[usuario.rolNombre];
    if (!rol) continue;

    await prisma.usuarios.upsert({
      where: { email: usuario.email },
      update: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rolId: rol.id,
        activo: true,
      },
      create: {
        email: usuario.email,
        claveEncriptada,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rolId: rol.id,
        activo: true,
      },
    });
  }

  console.log('✅ Seeder módulo Usuarios completado');
  console.log(`   Credenciales de desarrollo: ${CLAVE_DESARROLLO}`);
  console.log('   admin@desarrollo.local / usuario@desarrollo.local');
}

async function ejecutarDirecto() {
  const { prisma } = await import('../providers/prisma.js');
  try {
    await seedUsuariosModulo(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutarDirecto().catch((error) => {
    console.error('Error en seeder usuarios:', error);
    process.exit(1);
  });
}
