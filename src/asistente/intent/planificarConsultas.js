import { extraerBusquedaProductoDesdeMensaje } from './busquedaProducto.js';
import { extraerDatosContacto, mensajePareceDatosContacto } from './extraerDatosContacto.js';
import { extraerFrasesProducto } from './extraerFrasesProducto.js';

function argsBuscarProductos(mensaje) {
  const busqueda = extraerBusquedaProductoDesdeMensaje(mensaje);
  const args = {};

  if (busqueda.terminoPrincipal) {
    args.search = busqueda.terminoPrincipal;
  }

  return { args, busqueda };
}

function extraerItemsPresupuesto(mensaje) {
  const items = [];
  const tipoCliente = /mayorista|revendedor|gastro/.test(mensaje.toLowerCase()) ? 'mayorista' : 'minorista';

  const idMatch = mensaje.match(/\b(100[0-9]|[1-9]\d{1,4})\b/);
  const qtyMatch = mensaje.match(/(\d+(?:[.,]\d+)?)\s*(unidades?|un\b|kg|cajas?)/i);

  if (idMatch) {
    const cantidad = qtyMatch ? Number(String(qtyMatch[1]).replace(',', '.')) : 1;
    items.push({
      productoId: idMatch[1],
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
    });
  }

  return { items, tipoCliente, pidePresupuesto: items.length > 0 };
}

function extraerPresupuestoId(mensaje) {
  return mensaje.match(/\b[a-f0-9]{24}\b/i)?.[0] ?? null;
}

function extraerMetodoPago(m) {
  if (/transferencia|transfer/.test(m)) {
    return 'transferencia';
  }
  if (/efectivo/.test(m)) {
    return 'efectivo';
  }
  if (/\bqr\b/.test(m)) {
    return 'qr';
  }
  if (/cuenta corriente/.test(m)) {
    return 'cuenta_corriente';
  }
  return undefined;
}

/**
 * Planifica tools determinísticas según el mensaje (sin LLM externo).
 */
export function planificarConsultas(mensaje) {
  const m = mensaje.toLowerCase();
  const plan = [];
  const datosContacto = extraerDatosContacto(mensaje);
  const pareceContacto = mensajePareceDatosContacto(mensaje);
  const { args: argsProductos, busqueda } = argsBuscarProductos(mensaje);

  if (datosContacto.tieneDatos && Object.keys(datosContacto.args).length > 0) {
    plan.push({ tool: 'actualizarLead', args: datosContacto.args });
  }

  const pideEnvio =
    /env[ií]o|entrega|demora|plazo|zona|localidad|yerba|taf[ií]|capital|llega/.test(m);
  const pidePrecio = /precio|cu[aá]nto|sale|cuesta|cotiz|vale/.test(m);
  const pideStock = /stock|disponible|hay|qued[aó]|unidades/.test(m);
  const saludoInicial = /^(hola|buen[oa]s|buen dia|hey)\b/.test(m.trim());
  const pideListadoProducto =
    /productos?|tienen|variedades|catalogo|catálogo|ofrecen/.test(m) ||
    Boolean(busqueda.terminoPrincipal);

  const pidePresupuestoExplicito = /presupuesto|cotizaci[oó]n|armar pedido|hacer pedido/.test(m);
  const presupuestoParseado = extraerItemsPresupuesto(mensaje);
  const pidePresupuesto = pidePresupuestoExplicito || presupuestoParseado.pidePresupuesto;
  const pidePdfPresupuesto =
    /pdf|descargar presupuesto|enviar presupuesto|mandame el presupuesto|gener[aá].*pdf/.test(m);
  const pideCierreVenta =
    /confirmo (la compra|el pedido|explicitamente)|cierro (la compra|el pedido)|confirmar compra/.test(
      m,
    );
  const presupuestoIdMencionado = extraerPresupuestoId(mensaje);

  const tieneItemsPresupuesto = presupuestoParseado.items.length > 0;
  const debeBuscarProductos =
    !pareceContacto &&
    !tieneItemsPresupuesto &&
    Object.keys(argsProductos).length > 0 &&
    (pidePrecio || pideStock || pideListadoProducto || (pidePresupuesto && !pidePresupuestoExplicito) || !pideEnvio);

  const frasesProducto = pidePrecio || pideStock || pideListadoProducto ? extraerFrasesProducto(mensaje) : [];

  if (debeBuscarProductos && frasesProducto.length > 1) {
    for (const frase of frasesProducto) {
      plan.push({ tool: 'buscarProductos', args: { search: frase.slice(0, 80) } });
    }
  } else if (debeBuscarProductos) {
    plan.push({ tool: 'buscarProductos', args: argsProductos });
  }

  const saludo =
    saludoInicial &&
    !pidePrecio &&
    !pideStock &&
    !pideListadoProducto &&
    !pareceContacto &&
    plan.filter((p) => p.tool === 'buscarProductos').length === 0;

  if (pidePresupuesto && tieneItemsPresupuesto) {
    plan.push({
      tool: 'calcularPresupuesto',
      args: {
        items: presupuestoParseado.items,
        tipoCliente: presupuestoParseado.tipoCliente,
      },
    });
  } else if (
    pidePresupuesto &&
    presupuestoParseado.items.length === 0 &&
    !plan.some((p) => p.tool === 'buscarProductos')
  ) {
    plan.push({
      tool: 'buscarProductos',
      args: argsProductos.search ? argsProductos : { listarCatalogo: true, limit: 10 },
    });
  }

  if (pideEnvio) {
    plan.push({
      tool: 'buscarPoliticas',
      args: { consulta: mensaje.slice(0, 500) },
    });
    plan.push({
      tool: 'consultarEnvio',
      args: {
        localidad: extraerLocalidad(m) ?? 'San Miguel de Tucumán',
        departamento: 'Tucumán',
      },
    });
  }

  if (pidePrecio && !plan.some((p) => p.tool === 'buscarProductos')) {
    plan.push({
      tool: 'buscarProductos',
      args: argsProductos.search ? argsProductos : { search: 'ricota' },
    });
  }

  if (pidePdfPresupuesto) {
    plan.push({
      tool: 'generarPresupuestoPdf',
      args: presupuestoIdMencionado ? { presupuestoId: presupuestoIdMencionado } : {},
    });
  }

  if (pideCierreVenta) {
    plan.push({
      tool: 'cerrarVenta',
      args: {
        confirmacionExplicita: true,
        ...(presupuestoIdMencionado ? { presupuestoId: presupuestoIdMencionado } : {}),
        ...(extraerMetodoPago(m) ? { metodoPagoPreferido: extraerMetodoPago(m) } : {}),
      },
    });
  }

  return {
    plan,
    saludo,
    search: busqueda.terminoPrincipal,
    pidePrecio,
    pideStock,
    pideEnvio,
    pidePresupuesto,
    pidePdfPresupuesto,
    pideCierreVenta,
  };
}

function extraerLocalidad(m) {
  const match = m.match(/(?:en|a|para)\s+([a-záéíóúñ\s]{3,40}?)(?:\?|\.|,|$| y )/i);
  return match?.[1]?.trim() ?? null;
}
