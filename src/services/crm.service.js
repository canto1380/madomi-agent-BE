import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { isMongoHabilitado, getEstadoMongo } from '../mongo/connection.js';
import { hashContenido } from '../utils/contentHash.js';
import { partirMarkdownPorSecciones } from '../utils/markdownChunks.js';
import { buscarEmpresaPorSlugRepositorio } from '../mongo/repositories/empresas.repository.js';
import {
  buscarContextoPorHashRepositorio,
  cerrarContextosVigentesRepositorio,
  crearContextoRepositorio,
} from '../mongo/repositories/empresaContextos.repository.js';
import {
  listarLeadsAdminRepositorio,
  contarLeadsAdminRepositorio,
  buscarLeadPorIdEmpresaRepositorio,
  actualizarLeadRepositorio,
  aggregateEmbudoLeadsRepositorio,
  aggregateProductosInteresLeadsRepositorio,
  aggregateLocalidadesLeadsRepositorio,
  aggregateCuellosBotellaLeadsRepositorio,
  aggregateAbandonoLeadsRepositorio,
  contarLeadsPorEstadoRepositorio,
} from '../mongo/repositories/leads.repository.js';
import {
  buscarClientePorIdRepositorio,
  buscarClienteIdsPorTextoRepositorio,
} from '../mongo/repositories/clientes.repository.js';
import { buscarConversacionPorIdRepositorio } from '../mongo/repositories/conversaciones.repository.js';
import {
  listarPresupuestosAdminRepositorio,
  contarPresupuestosAdminRepositorio,
  buscarPresupuestoPorIdRepositorio,
} from '../mongo/repositories/presupuestos.repository.js';
import {
  listarPedidosAdminRepositorio,
  contarPedidosAdminRepositorio,
  buscarPedidoPorIdRepositorio,
  actualizarPedidoRepositorio,
} from '../mongo/repositories/pedidos.repository.js';
import {
  actualizarLeadSchema,
  actualizarPedidoSchema,
  listarLeadsQuerySchema,
  listarPedidosQuerySchema,
  listarPresupuestosQuerySchema,
  publicarContextoSchema,
} from '../validations/crm.validation.js';

function parseConZod(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('Error de validación en parámetros', 400, 'VALIDATION_ERROR');
  }
  return result.data;
}

function asegurarCrmMongo() {
  if (!isMongoHabilitado()) {
    throw new AppError('Módulo CRM deshabilitado', 503, 'CRM_DISABLED');
  }
  if (getEstadoMongo() !== 'connected') {
    throw new AppError('MongoDB no conectado', 503, 'MONGO_UNAVAILABLE');
  }
}

async function obtenerEmpresaCrm() {
  const empresa = await buscarEmpresaPorSlugRepositorio(env.ASISTENTE_EMPRESA_SLUG);
  if (!empresa) {
    throw new AppError('Empresa no configurada en CRM', 404, 'NOT_FOUND');
  }
  return empresa;
}

function asegurarObjectId(id, etiqueta = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${etiqueta} inválido`, 400, 'VALIDATION_ERROR');
  }
}

function parsearFechaFiltro(valor, finDeDia = false) {
  if (!valor) {
    return null;
  }
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) {
    throw new AppError('Fecha inválida en filtros', 400, 'VALIDATION_ERROR');
  }
  if (finDeDia && valor.length <= 10) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

function paginacionDesdeQuery(query, sortDefault, camposSort) {
  const sortField = camposSort.includes(query.sort) ? query.sort : sortDefault;
  const order = query.order === 'asc' ? 1 : -1;
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  return {
    sort: { [sortField]: order },
    skip: (page - 1) * limit,
    limit,
    page,
  };
}

function respuestaPaginada(items, total, page, limit) {
  return {
    items,
    paginacion: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

function mapearClienteResumen(doc) {
  if (!doc) {
    return null;
  }
  return {
    id: String(doc._id),
    nombre: doc.nombre,
    apellido: doc.apellido,
    email: doc.email,
    telefono: doc.telefono,
    telefonoNormalizado: doc.telefonoNormalizado,
    localidad: doc.localidad,
    departamento: doc.departamento,
    provincia: doc.provincia,
  };
}

function mapearLeadAdmin(doc) {
  return {
    id: String(doc._id),
    estado: doc.estado,
    clienteId: doc.clienteId ? String(doc.clienteId) : null,
    conversacionIdActiva: doc.conversacionIdActiva ? String(doc.conversacionIdActiva) : null,
    localidad: doc.localidad,
    departamento: doc.departamento,
    cuelloBotella: doc.cuelloBotella ?? null,
    motivoAbandono: doc.motivoAbandono,
    asignadoAUsuarioId: doc.asignadoAUsuarioId,
    productosInteres: doc.productosInteres ?? [],
    datosCapturados: doc.datosCapturados ?? {},
    seguimientoComercial: doc.datosCapturados?.seguimientoComercial ?? null,
    requiereContactoComercial: Boolean(doc.requiereContactoComercial),
    notas: doc.datosCapturados?.notasAdmin ?? null,
    ultimoMensajeAt: doc.ultimoMensajeAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapearConversacionResumida(doc) {
  if (!doc) {
    return null;
  }
  const mensajes = doc.mensajes ?? [];
  const ultimos = mensajes.slice(-3).map((m) => ({
    rol: m.rol,
    contenido: m.contenido?.slice(0, 280) ?? '',
    createdAt: m.createdAt,
  }));
  return {
    id: String(doc._id),
    canal: doc.canal,
    escaladoHumano: doc.escaladoHumano,
    mensajesCount: mensajes.length,
    ultimosMensajes: ultimos,
    updatedAt: doc.updatedAt,
  };
}

function mapearConversacionCompleta(doc) {
  return {
    id: String(doc._id),
    leadId: doc.leadId ? String(doc.leadId) : null,
    clienteId: doc.clienteId ? String(doc.clienteId) : null,
    canal: doc.canal,
    sessionAnonimaId: doc.sessionAnonimaId,
    escaladoHumano: doc.escaladoHumano,
    mensajes: (doc.mensajes ?? []).map((m) => ({
      rol: m.rol,
      contenido: m.contenido,
      toolCalls: m.toolCalls,
      toolResult: m.toolResult,
      createdAt: m.createdAt,
    })),
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapearPresupuestoAdmin(doc) {
  return {
    id: String(doc._id),
    leadId: doc.leadId ? String(doc.leadId) : null,
    clienteId: doc.clienteId ? String(doc.clienteId) : null,
    conversacionId: doc.conversacionId ? String(doc.conversacionId) : null,
    items: doc.items,
    subtotal: doc.subtotal,
    descuentoTotal: doc.descuentoTotal,
    costoEnvio: doc.costoEnvio,
    total: doc.total,
    moneda: doc.moneda,
    estado: doc.estado,
    pdfUrl: doc.pdfUrl,
    validezHasta: doc.validezHasta,
    generadoPor: doc.generadoPor,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapearPedidoAdmin(doc) {
  return {
    id: String(doc._id),
    leadId: doc.leadId ? String(doc.leadId) : null,
    presupuestoId: doc.presupuestoId ? String(doc.presupuestoId) : null,
    clienteId: doc.clienteId ? String(doc.clienteId) : null,
    items: doc.items,
    totales: doc.totales,
    estadoLogistico: doc.estadoLogistico,
    metodoPagoPreferido: doc.metodoPagoPreferido,
    confirmacionClienteAt: doc.confirmacionClienteAt,
    cerradoPor: doc.cerradoPor,
    cerradoPorUsuarioId: doc.cerradoPorUsuarioId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function construirFiltroLeads(empresaId, query) {
  const filtro = {};
  if (query.estado) {
    filtro.estado = query.estado;
  }
  if (query.localidad) {
    filtro.localidad = { $regex: query.localidad, $options: 'i' };
  }
  if (query.productoId) {
    filtro['productosInteres.productoId'] = query.productoId;
  }
  if (query.requiereContacto === true) {
    filtro.requiereContactoComercial = true;
  }
  const desde = parsearFechaFiltro(query.desde);
  const hasta = parsearFechaFiltro(query.hasta, true);
  if (desde || hasta) {
    filtro.updatedAt = {};
    if (desde) {
      filtro.updatedAt.$gte = desde;
    }
    if (hasta) {
      filtro.updatedAt.$lte = hasta;
    }
  }
  const idsCliente = await buscarClienteIdsPorTextoRepositorio(empresaId, {
    telefono: query.telefono,
    nombre: query.nombre,
  });
  if (idsCliente) {
    if (idsCliente.length === 0) {
      return { imposible: true, filtro };
    }
    filtro.clienteId = { $in: idsCliente };
  }
  return { imposible: false, filtro };
}

function construirFiltroFechas(desde, hasta, campo = 'createdAt') {
  const filtro = {};
  const d = parsearFechaFiltro(desde);
  const h = parsearFechaFiltro(hasta, true);
  if (d || h) {
    filtro[campo] = {};
    if (d) {
      filtro[campo].$gte = d;
    }
    if (h) {
      filtro[campo].$lte = h;
    }
  }
  return filtro;
}

export async function listarLeadsAdminServicio(rawQuery = {}) {
  asegurarCrmMongo();
  const query = parseConZod(listarLeadsQuerySchema, rawQuery);
  const empresa = await obtenerEmpresaCrm();
  const { imposible, filtro } = await construirFiltroLeads(empresa._id, query);
  const { sort, skip, limit, page } = paginacionDesdeQuery(query, 'updatedAt', [
    'updatedAt',
    'ultimoMensajeAt',
    'createdAt',
    'estado',
  ]);

  if (imposible) {
    return respuestaPaginada([], 0, page, limit);
  }

  const [rows, total] = await Promise.all([
    listarLeadsAdminRepositorio(empresa._id, { filtro, sort, skip, limit }),
    contarLeadsAdminRepositorio(empresa._id, filtro),
  ]);

  const items = await Promise.all(
    rows.map(async (lead) => {
      const cliente = lead.clienteId ? await buscarClientePorIdRepositorio(lead.clienteId) : null;
      return {
        ...mapearLeadAdmin(lead),
        cliente: mapearClienteResumen(cliente),
      };
    }),
  );

  return respuestaPaginada(items, total, page, limit);
}

export async function obtenerLeadAdminServicio(leadId) {
  asegurarCrmMongo();
  asegurarObjectId(leadId, 'Lead');
  const empresa = await obtenerEmpresaCrm();
  const lead = await buscarLeadPorIdEmpresaRepositorio(leadId, empresa._id);
  if (!lead) {
    throw new AppError('Lead no encontrado', 404, 'NOT_FOUND');
  }

  const [cliente, conversacion] = await Promise.all([
    lead.clienteId ? buscarClientePorIdRepositorio(lead.clienteId) : null,
    lead.conversacionIdActiva
      ? buscarConversacionPorIdRepositorio(lead.conversacionIdActiva, empresa._id)
      : null,
  ]);

  return {
    ...mapearLeadAdmin(lead),
    cliente: mapearClienteResumen(cliente),
    conversacion: mapearConversacionResumida(conversacion),
  };
}

export async function actualizarLeadAdminServicio(leadId, rawBody) {
  asegurarCrmMongo();
  asegurarObjectId(leadId, 'Lead');
  const body = parseConZod(actualizarLeadSchema, rawBody);
  const empresa = await obtenerEmpresaCrm();
  const existente = await buscarLeadPorIdEmpresaRepositorio(leadId, empresa._id);
  if (!existente) {
    throw new AppError('Lead no encontrado', 404, 'NOT_FOUND');
  }

  const update = {};
  if (body.estado !== undefined) {
    update.estado = body.estado;
  }
  if (body.asignadoAUsuarioId !== undefined) {
    update.asignadoAUsuarioId = body.asignadoAUsuarioId;
  }
  if (body.cuelloBotella !== undefined) {
    update.cuelloBotella = body.cuelloBotella;
  }
  if (body.motivoAbandono !== undefined) {
    update.motivoAbandono = body.motivoAbandono;
  }
  if (body.notas !== undefined) {
    update.datosCapturados = {
      ...(existente.datosCapturados ?? {}),
      notasAdmin: body.notas,
    };
  }

  const actualizado = await actualizarLeadRepositorio(leadId, update);
  return mapearLeadAdmin(actualizado);
}

export async function obtenerConversacionAdminServicio(conversacionId) {
  asegurarCrmMongo();
  asegurarObjectId(conversacionId, 'Conversación');
  const empresa = await obtenerEmpresaCrm();
  const doc = await buscarConversacionPorIdRepositorio(conversacionId, empresa._id);
  if (!doc) {
    throw new AppError('Conversación no encontrada', 404, 'NOT_FOUND');
  }
  return mapearConversacionCompleta(doc);
}

export async function listarPresupuestosAdminServicio(rawQuery = {}) {
  asegurarCrmMongo();
  const query = parseConZod(listarPresupuestosQuerySchema, rawQuery);
  const empresa = await obtenerEmpresaCrm();
  const filtro = {
    ...construirFiltroFechas(query.desde, query.hasta),
  };
  if (query.estado) {
    filtro.estado = query.estado;
  }
  if (query.clienteId) {
    filtro.clienteId = new mongoose.Types.ObjectId(query.clienteId);
  }
  if (query.leadId) {
    filtro.leadId = new mongoose.Types.ObjectId(query.leadId);
  }

  const { sort, skip, limit, page } = paginacionDesdeQuery(query, 'createdAt', [
    'createdAt',
    'updatedAt',
    'total',
    'estado',
  ]);

  const [rows, total] = await Promise.all([
    listarPresupuestosAdminRepositorio(empresa._id, { filtro, sort, skip, limit }),
    contarPresupuestosAdminRepositorio(empresa._id, filtro),
  ]);

  return respuestaPaginada(rows.map(mapearPresupuestoAdmin), total, page, limit);
}

export async function obtenerPresupuestoPdfAdminServicio(presupuestoId) {
  asegurarCrmMongo();
  asegurarObjectId(presupuestoId, 'Presupuesto');
  const empresa = await obtenerEmpresaCrm();
  const doc = await buscarPresupuestoPorIdRepositorio(presupuestoId, empresa._id);
  if (!doc) {
    throw new AppError('Presupuesto no encontrado', 404, 'NOT_FOUND');
  }
  if (!doc.pdfUrl) {
    throw new AppError('Este presupuesto aún no tiene PDF generado', 404, 'NOT_FOUND');
  }
  return { pdfUrl: doc.pdfUrl };
}

export async function listarPedidosAdminServicio(rawQuery = {}) {
  asegurarCrmMongo();
  const query = parseConZod(listarPedidosQuerySchema, rawQuery);
  const empresa = await obtenerEmpresaCrm();
  const filtro = {
    ...construirFiltroFechas(query.desde, query.hasta),
  };
  if (query.estadoLogistico) {
    filtro.estadoLogistico = query.estadoLogistico;
  }
  if (query.clienteId) {
    filtro.clienteId = new mongoose.Types.ObjectId(query.clienteId);
  }
  if (query.leadId) {
    filtro.leadId = new mongoose.Types.ObjectId(query.leadId);
  }

  const { sort, skip, limit, page } = paginacionDesdeQuery(query, 'createdAt', [
    'createdAt',
    'updatedAt',
    'estadoLogistico',
  ]);

  const [rows, total] = await Promise.all([
    listarPedidosAdminRepositorio(empresa._id, { filtro, sort, skip, limit }),
    contarPedidosAdminRepositorio(empresa._id, filtro),
  ]);

  return respuestaPaginada(rows.map(mapearPedidoAdmin), total, page, limit);
}

export async function actualizarPedidoAdminServicio(pedidoId, rawBody) {
  asegurarCrmMongo();
  asegurarObjectId(pedidoId, 'Pedido');
  const body = parseConZod(actualizarPedidoSchema, rawBody);

  const empresa = await obtenerEmpresaCrm();
  const existente = await buscarPedidoPorIdRepositorio(pedidoId, empresa._id);
  if (!existente) {
    throw new AppError('Pedido no encontrado', 404, 'NOT_FOUND');
  }

  const { aplicarTransicionStockPedido } = await import('../asistente/stock/transicionPedidoStock.js');

  if (body.estadoLogistico !== existente.estadoLogistico) {
    await aplicarTransicionStockPedido(existente, existente.estadoLogistico, body.estadoLogistico);
  }

  const actualizado = await actualizarPedidoRepositorio(pedidoId, empresa._id, {
    estadoLogistico: body.estadoLogistico,
  });
  return mapearPedidoAdmin(actualizado);
}

export async function statsResumenCrmServicio() {
  asegurarCrmMongo();
  const empresa = await obtenerEmpresaCrm();

  const [embudoRows, productos, localidades, presupuestosEnviados, pedidosCerrados, totalLeads] =
    await Promise.all([
      aggregateEmbudoLeadsRepositorio(empresa._id),
      aggregateProductosInteresLeadsRepositorio(empresa._id, { limit: 8 }),
      aggregateLocalidadesLeadsRepositorio(empresa._id, { limit: 8 }),
      contarLeadsPorEstadoRepositorio(empresa._id, 'presupuesto_enviado'),
      contarLeadsPorEstadoRepositorio(empresa._id, 'pedido_cerrado'),
      contarLeadsAdminRepositorio(empresa._id, {}),
    ]);

  const embudo = Object.fromEntries(embudoRows.map((r) => [r._id, r.total]));
  const conversion =
    presupuestosEnviados > 0 ? Number((pedidosCerrados / presupuestosEnviados).toFixed(4)) : null;

  return {
    totalLeads,
    embudo,
    conversionPresupuestoEnviadoAPedido: conversion,
    productosMasConsultados: productos.map((p) => ({
      productoId: p._id,
      nombre: p.nombre,
      total: p.total,
    })),
    topLocalidades: localidades.map((l) => ({
      localidad: l._id,
      total: l.total,
    })),
  };
}

export async function statsCuelloBotellaCrmServicio() {
  asegurarCrmMongo();
  const empresa = await obtenerEmpresaCrm();
  const [cuellos, abandonos] = await Promise.all([
    aggregateCuellosBotellaLeadsRepositorio(empresa._id),
    aggregateAbandonoLeadsRepositorio(empresa._id, { limit: 12 }),
  ]);

  return {
    porCuelloBotella: cuellos.map((c) => ({ cuello: c._id, total: c.total })),
    motivosAbandono: abandonos.map((a) => ({ motivo: a._id, total: a.total })),
  };
}

export async function publicarContextoCrmServicio(rawBody) {
  asegurarCrmMongo();
  const body = parseConZod(publicarContextoSchema, rawBody);
  const empresa = await obtenerEmpresaCrm();
  const hash = hashContenido(body.markdown);

  const duplicado = await buscarContextoPorHashRepositorio(empresa._id, body.tipo, hash);
  if (duplicado) {
    return {
      id: String(duplicado._id),
      tipo: duplicado.tipo,
      version: duplicado.version,
      hash: duplicado.hash,
      vigenteDesde: duplicado.vigenteDesde,
      chunksCount: duplicado.chunks?.length ?? 0,
      duplicado: true,
    };
  }

  const ahora = new Date();
  await cerrarContextosVigentesRepositorio(empresa._id, body.tipo, ahora);
  const chunks = partirMarkdownPorSecciones(body.markdown);
  const doc = await crearContextoRepositorio({
    empresaId: empresa._id,
    tipo: body.tipo,
    version: body.version,
    markdown: body.markdown,
    hash,
    origenPdfUrl: body.origenPdfUrl ?? null,
    vigenteDesde: ahora,
    vigenteHasta: null,
    chunks,
  });

  return {
    id: String(doc._id),
    tipo: doc.tipo,
    version: doc.version,
    hash: doc.hash,
    vigenteDesde: doc.vigenteDesde,
    chunksCount: chunks.length,
    duplicado: false,
  };
}
