import { z } from 'zod';
import { normalizarTelefono } from '../../utils/telefono.js';
import {
  buscarPresupuestoPorIdRepositorio,
  buscarUltimoPresupuestoPorLeadRepositorio,
} from '../../mongo/repositories/presupuestos.repository.js';
import { buscarLeadPorIdRepositorio, actualizarLeadRepositorio } from '../../mongo/repositories/leads.repository.js';
import { upsertClientePorTelefonoRepositorio } from '../../mongo/repositories/clientes.repository.js';
import { vincularLeadClienteConversacionRepositorio } from '../../mongo/repositories/conversaciones.repository.js';
import { crearPedidoRepositorio } from '../../mongo/repositories/pedidos.repository.js';
import { obtenerProductoComercialPorIdRepositorio } from '../../repositories/productos.repository.js';
import {
  calcularStockDisponible,
  comprometerStockComercialRepositorio,
  descontarStockFisicoRepositorio,
} from '../stock/stockComercial.js';
import { resolverModoStockAlCerrar } from '../stock/resolverModoStock.js';

const itemSchema = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().positive(),
});

const clienteSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().min(8),
  direccion: z.string().min(5),
  localidad: z.string().min(2),
  departamento: z.string().min(2),
  provincia: z.string().default('Tucumán'),
});

const argsSchema = z.object({
  confirmacionExplicita: z.literal(true),
  presupuestoId: z.string().optional(),
  cliente: clienteSchema.optional(),
  items: z.array(itemSchema).min(1).optional(),
  metodoPagoPreferido: z
    .enum(['transferencia', 'efectivo', 'qr', 'cuenta_corriente'])
    .optional(),
});

function clienteDesdeLead(lead) {
  const d = lead.datosCapturados ?? {};
  return {
    nombre: d.nombre,
    apellido: d.apellido,
    email: d.email,
    telefono: d.telefono,
    direccion: d.direccion,
    localidad: d.localidad ?? lead.localidad,
    departamento: d.departamento ?? lead.departamento,
    provincia: d.provincia ?? 'Tucumán',
  };
}

export const cerrarVentaTool = {
  name: 'cerrarVenta',
  description:
    'Cierra la venta con confirmación explícita; crea pedido y compromete o descuenta stock según configuración.',
  parameters: {
    type: 'object',
    properties: {
      confirmacionExplicita: { type: 'boolean', const: true },
      presupuestoId: { type: 'string' },
      cliente: { type: 'object' },
      items: { type: 'array' },
      metodoPagoPreferido: {
        type: 'string',
        enum: ['transferencia', 'efectivo', 'qr', 'cuenta_corriente'],
      },
    },
    required: ['confirmacionExplicita'],
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const modoStock = resolverModoStockAlCerrar();

    const lead = await buscarLeadPorIdRepositorio(ctx.leadId);
    if (!lead || String(lead.empresaId) !== String(ctx.empresaId)) {
      return { ok: false, error: 'LEAD_NO_ENCONTRADO' };
    }

    let presupuesto = null;
    if (args.presupuestoId) {
      presupuesto = await buscarPresupuestoPorIdRepositorio(args.presupuestoId, ctx.empresaId);
    } else {
      presupuesto = await buscarUltimoPresupuestoPorLeadRepositorio(ctx.empresaId, ctx.leadId);
    }

    if (!presupuesto) {
      return { ok: false, error: 'PRESUPUESTO_REQUERIDO' };
    }

    const items =
      args.items ??
      presupuesto.items?.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })) ??
      [];

    if (items.length === 0) {
      return { ok: false, error: 'ITEMS_VACIOS' };
    }

    let clienteInput = args.cliente;
    if (!clienteInput) {
      const candidato = clienteDesdeLead(lead);
      const parsed = clienteSchema.safeParse(candidato);
      if (!parsed.success) {
        return {
          ok: false,
          error: 'DATOS_CLIENTE_INCOMPLETOS',
          camposFaltantes: parsed.error.issues.map((i) => i.path.join('.')),
        };
      }
      clienteInput = parsed.data;
    }

    const advertenciasStock = [];
    for (const item of items) {
      const producto = await obtenerProductoComercialPorIdRepositorio(item.productoId);
      if (!producto) {
        return { ok: false, error: 'PRODUCTO_NO_DISPONIBLE', productoId: item.productoId };
      }
      const disponible = calcularStockDisponible(producto);
      if (modoStock !== 'ninguno' && disponible < item.cantidad) {
        advertenciasStock.push({
          productoId: item.productoId,
          nombre: producto.nombre,
          stockDisponible: disponible,
          stockFisico: producto.stockUnidades,
          stockComprometido: producto.stockComprometidoUnidades ?? 0,
          solicitado: item.cantidad,
        });
      }
    }

    if (modoStock !== 'ninguno' && advertenciasStock.length > 0) {
      return {
        ok: false,
        error: 'STOCK_INSUFICIENTE',
        advertenciasStock,
      };
    }

    const telefonoNormalizado = normalizarTelefono(clienteInput.telefono);
    const cliente = await upsertClientePorTelefonoRepositorio(ctx.empresaId, {
      ...clienteInput,
      telefonoNormalizado,
    });

    if (ctx.conversacionId && cliente) {
      await vincularLeadClienteConversacionRepositorio(ctx.conversacionId, {
        leadId: ctx.leadId,
        clienteId: cliente._id,
      });
    }

    const lineasPedido = presupuesto.items?.length
      ? presupuesto.items
      : items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          nombreSnapshot: i.productoId,
          subtotalLinea: 0,
        }));

    let stockReserva = null;
    const movimientosStock = [];

    if (modoStock === 'comprometer') {
      for (const item of items) {
        const r = await comprometerStockComercialRepositorio(item.productoId, item.cantidad);
        movimientosStock.push({ productoId: item.productoId, ...r });
        if (!r.ok) {
          return { ok: false, error: 'STOCK_COMPROMISO_FALLIDO', detalle: movimientosStock };
        }
      }
      stockReserva = 'comprometido';
    } else if (modoStock === 'descontar') {
      for (const item of items) {
        const r = await descontarStockFisicoRepositorio(item.productoId, item.cantidad);
        movimientosStock.push({ productoId: item.productoId, ...r });
        if (!r.ok) {
          return { ok: false, error: 'STOCK_DESCUENTO_FALLIDO', detalle: movimientosStock };
        }
      }
      stockReserva = 'descontado_fisico';
    }

    const pedido = await crearPedidoRepositorio({
      empresaId: ctx.empresaId,
      leadId: ctx.leadId,
      presupuestoId: presupuesto._id,
      clienteId: cliente?._id ?? null,
      items: lineasPedido,
      totales: {
        subtotal: presupuesto.subtotal ?? 0,
        descuentoTotal: presupuesto.descuentoTotal ?? 0,
        costoEnvio: presupuesto.costoEnvio ?? 0,
        total: presupuesto.total ?? 0,
      },
      estadoLogistico: 'pedido_cerrado',
      metodoPagoPreferido: args.metodoPagoPreferido ?? null,
      confirmacionClienteAt: new Date(),
      cerradoPor: 'agente',
      stockReserva,
    });

    await actualizarLeadRepositorio(ctx.leadId, {
      estado: 'pedido_cerrado',
      clienteId: cliente?._id ?? lead.clienteId,
      ultimoMensajeAt: new Date(),
    });

    return {
      ok: true,
      pedidoId: String(pedido._id),
      presupuestoId: String(presupuesto._id),
      estadoLead: 'pedido_cerrado',
      modoStock,
      stockReserva,
      movimientosStock,
    };
  },
};
