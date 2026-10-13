import { z } from 'zod';
import { normalizarTelefono } from '../../utils/telefono.js';
import {
  mergeDatosCapturadosLeadRepositorio,
  actualizarLeadRepositorio,
  buscarLeadPorIdRepositorio,
} from '../../mongo/repositories/leads.repository.js';
import { upsertClientePorTelefonoRepositorio } from '../../mongo/repositories/clientes.repository.js';
import { vincularLeadClienteConversacionRepositorio } from '../../mongo/repositories/conversaciones.repository.js';

const argsSchema = z.object({
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  cuelloBotella: z.enum(['precio', 'envio', 'stock', 'solo_consulta', 'otro']).optional(),
  estado: z
    .enum([
      'nuevo',
      'consultando',
      'presupuesto_abierto',
      'presupuesto_enviado',
      'pendiente_validacion_logistica',
    ])
    .optional(),
});

export const actualizarLeadTool = {
  name: 'actualizarLead',
  description: 'Guarda o actualiza datos parciales del cliente y del lead comercial.',
  parameters: {
    type: 'object',
    properties: {
      nombre: { type: 'string' },
      apellido: { type: 'string' },
      email: { type: 'string' },
      telefono: { type: 'string' },
      direccion: { type: 'string' },
      localidad: { type: 'string' },
      departamento: { type: 'string' },
      provincia: { type: 'string' },
      cuelloBotella: {
        type: 'string',
        enum: ['precio', 'envio', 'stock', 'solo_consulta', 'otro'],
      },
      estado: { type: 'string' },
    },
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const parcial = { ...args };
    delete parcial.estado;
    delete parcial.cuelloBotella;

    await mergeDatosCapturadosLeadRepositorio(ctx.leadId, parcial);

    const updateLead = { ultimoMensajeAt: new Date() };
    if (args.cuelloBotella) {
      updateLead.cuelloBotella = args.cuelloBotella;
    }
    if (args.estado) {
      updateLead.estado = args.estado;
    }
    if (args.localidad) {
      updateLead.localidad = args.localidad;
    }
    if (args.departamento) {
      updateLead.departamento = args.departamento;
    }

    let clienteId = ctx.clienteId ?? null;
    if (args.telefono) {
      const telefonoNormalizado = normalizarTelefono(args.telefono);
      const cliente = await upsertClientePorTelefonoRepositorio(ctx.empresaId, {
        telefono: args.telefono,
        telefonoNormalizado,
        nombre: args.nombre,
        apellido: args.apellido,
        email: args.email,
        direccion: args.direccion,
        localidad: args.localidad,
        departamento: args.departamento,
        provincia: args.provincia ?? 'Tucumán',
      });
      if (cliente) {
        clienteId = cliente._id;
        updateLead.clienteId = cliente._id;
      }
    }

    await actualizarLeadRepositorio(ctx.leadId, updateLead);

    if (clienteId && ctx.conversacionId) {
      await vincularLeadClienteConversacionRepositorio(ctx.conversacionId, {
        leadId: ctx.leadId,
        clienteId,
      });
    }

    const lead = await buscarLeadPorIdRepositorio(ctx.leadId);
    return {
      ok: true,
      leadId: String(lead._id),
      clienteId: lead.clienteId ? String(lead.clienteId) : null,
      estado: lead.estado,
      datosCapturados: lead.datosCapturados,
    };
  },
};
