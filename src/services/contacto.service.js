import { AppError } from '../errors/AppError.js';
import {
  obtenerContactoActivoRepositorio,
  obtenerContactoRepositorio,
  actualizarContactoRepositorio,
} from '../repositories/contacto.repository.js';

function mapearContactoPublico(c) {
  return {
    telefono: c.telefono,
    telefonoLink: c.telefonoLink,
    email: c.email,
    whatsapp: c.whatsapp,
    direccion: c.direccion,
    horario: c.horario,
  };
}

function mapearContactoAdmin(c) {
  return {
    id: c.id,
    telefono: c.telefono,
    telefonoLink: c.telefonoLink,
    email: c.email,
    whatsapp: c.whatsapp,
    direccion: c.direccion,
    horario: c.horario,
    activo: c.activo,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export async function obtenerContactoPublicoServicio() {
  const contacto = await obtenerContactoActivoRepositorio();
  if (!contacto) throw new AppError('Contacto no disponible', 404, 'NOT_FOUND');
  return mapearContactoPublico(contacto);
}

export async function obtenerContactoAdminServicio() {
  const contacto = await obtenerContactoRepositorio();
  if (!contacto) throw new AppError('Contacto no encontrado', 404, 'NOT_FOUND');
  return mapearContactoAdmin(contacto);
}

export async function actualizarContactoServicio(data) {
  const contacto = await obtenerContactoRepositorio();
  if (!contacto) throw new AppError('Contacto no encontrado', 404, 'NOT_FOUND');

  const actualizado = await actualizarContactoRepositorio(data);
  return mapearContactoAdmin(actualizado);
}
