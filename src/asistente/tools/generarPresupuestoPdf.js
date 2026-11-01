import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import {
  buscarPresupuestoPorIdRepositorio,
  buscarUltimoPresupuestoPorLeadRepositorio,
  actualizarPresupuestoPorIdRepositorio,
} from '../../mongo/repositories/presupuestos.repository.js';
import { buscarClientePorIdRepositorio } from '../../mongo/repositories/clientes.repository.js';
import { actualizarLeadRepositorio } from '../../mongo/repositories/leads.repository.js';
import { env } from '../../config/env.js';
import { isStorageConfigured, uploadBufferToStorage } from '../../services/storage.service.js';
import { renderPresupuestoPdfBuffer } from '../presupuesto/renderPresupuestoPdf.js';
import { obtenerContextoPdfPresupuesto } from '../presupuesto/obtenerContextoPdf.js';

const argsSchema = z.object({
  presupuestoId: z.string().min(1).optional(),
});

export const generarPresupuestoPdfTool = {
  name: 'generarPresupuestoPdf',
  description: 'Genera PDF del presupuesto, lo sube a storage y marca estado enviado.',
  parameters: {
    type: 'object',
    properties: {
      presupuestoId: { type: 'string', description: 'Opcional; default último presupuesto del lead' },
    },
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);

    let presupuesto = null;
    if (args.presupuestoId) {
      presupuesto = await buscarPresupuestoPorIdRepositorio(args.presupuestoId, ctx.empresaId);
    } else {
      presupuesto = await buscarUltimoPresupuestoPorLeadRepositorio(ctx.empresaId, ctx.leadId);
    }

    if (!presupuesto) {
      return { ok: false, error: 'PRESUPUESTO_NO_ENCONTRADO' };
    }

    if (String(presupuesto.leadId) !== String(ctx.leadId)) {
      return { ok: false, error: 'PRESUPUESTO_NO_PERMITIDO' };
    }

    if (!presupuesto.items?.length) {
      return { ok: false, error: 'PRESUPUESTO_SIN_ITEMS' };
    }

    if (presupuesto.pdfUrl && presupuesto.estado === 'enviado') {
      return {
        ok: true,
        presupuestoId: String(presupuesto._id),
        pdfUrl: presupuesto.pdfUrl,
        estado: presupuesto.estado,
        reutilizado: true,
      };
    }

    if (!isStorageConfigured()) {
      return {
        ok: false,
        error: 'STORAGE_NOT_CONFIGURED',
        mensaje:
          env.STORAGE_DRIVER === 'local'
            ? 'Configurá STORAGE_PUBLIC_BASE_URL para guardar archivos en el servidor.'
            : 'Configurá SUPABASE_URL y claves para generar PDF.',
      };
    }

    const clienteId = presupuesto.clienteId ?? ctx.clienteId;
    const cliente = clienteId ? await buscarClientePorIdRepositorio(clienteId) : null;
    const contextoPdf = await obtenerContextoPdfPresupuesto();

    let buffer;
    try {
      buffer = await renderPresupuestoPdfBuffer({
        presupuesto,
        cliente,
        contextoPdf,
      });
    } catch (error) {
      throw new AppError('No se pudo generar el PDF', 500, 'PDF_GENERATION_ERROR');
    }

    const storagePath = `comercial/presupuestos/${presupuesto._id}.pdf`;
    const pdfUrl = await uploadBufferToStorage(buffer, { storagePath });

    const actualizado = await actualizarPresupuestoPorIdRepositorio(presupuesto._id, ctx.empresaId, {
      pdfUrl,
      estado: 'enviado',
    });

    await actualizarLeadRepositorio(ctx.leadId, {
      estado: 'presupuesto_enviado',
      ultimoMensajeAt: new Date(),
    });

    return {
      ok: true,
      presupuestoId: String(actualizado._id),
      pdfUrl,
      estado: actualizado.estado,
    };
  },
};
