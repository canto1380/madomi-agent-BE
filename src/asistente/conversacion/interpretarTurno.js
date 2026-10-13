import { extraerDatosContacto, mensajePareceDatosContacto } from '../intent/extraerDatosContacto.js';
import {
  extraerLineasPedidoPorNombre,
  mensajePidePresupuestoExplicito,
} from '../intent/extraerItemsPresupuestoDesdeMensaje.js';
import { extraerFrasesProducto } from '../intent/extraerFrasesProducto.js';
import { extraerBusquedaProductoDesdeMensaje } from '../intent/busquedaProducto.js';
import { extraerPedidoNaturalDesdeMensaje } from '../intent/extraerPedidoNatural.js';
import { esConsultaPrecioGenerica } from '../intent/consultaPrecioGenerica.js';
import {
  mensajeReferenciaContextoSesion,
  productosEnSesion,
  resolverProductosParaMayorista,
} from './resolverProductosReferencia.js';
import { productoPorReferencia } from './estadoConversacion.js';

export const INTENCION = {
  SALUDO: 'saludo',
  SALUDO_CORDIAL: 'saludo_cordial',
  CATALOGO: 'catalogo',
  PRECIO: 'precio',
  PRECIO_REFERENCIA: 'precio_referencia',
  STOCK: 'stock',
  RECOMENDACION: 'recomendacion',
  CONFIRMACION_SI: 'confirmacion_si',
  CONFIRMACION_NO: 'confirmacion_no',
  ENVIO: 'envio',
  ENVIO_ZONA: 'envio_zona',
  COSTO_ENVIO: 'costo_envio',
  PRESUPUESTO: 'presupuesto',
  PEDIDO: 'pedido',
  DATOS_CONTACTO: 'datos_contacto',
  DESPEDIDA: 'despedida',
  AGRADECIMIENTO: 'agradecimiento',
  BUSQUEDA_PRODUCTO: 'busqueda_producto',
  OTRO: 'otro',
};

function trimLower(m) {
  return m.trim().toLowerCase();
}

function esSaludoPuro(mensaje) {
  const t = trimLower(mensaje).replace(/[!?.¡¿]+/g, '').trim();
  if (t.length > 40) {
    return false;
  }
  return /^(hola|buenas|buen\s*d[ií]a|hey|buen\s*tarde|buenas\s*tardes|buenas\s*noches)$/.test(t);
}

function esSaludoCordial(m) {
  return /c[oó]mo\s+(est[aá]n|andas|va|van)|qu[eé]\s+tal/.test(m);
}

function pideCatalogo(m) {
  return (
    /qu[eé]\s+(productos?|ten[eé]s|tienen|hay|venden|ofrecen)/.test(m) ||
    /(listado|cat[aá]logo|variedades|qu[eé]\s+cosas)\b/.test(m) ||
    /productos?\s+(tienen|ten[eé]s|hay|venden)/.test(m) ||
    /mostr(a|á|ame)\s+(los\s+)?productos/.test(m)
  );
}

function pideNovedades(m) {
  return (
    /novedad|lo [úu]ltimo|productos nuevos|secci[oó]n de novedades|lanzamiento/.test(m) ||
    (pidePrecioExplicito(m) && /nuevos|novedad/.test(m))
  );
}

function pidePrecioMayorista(m) {
  return /mayorista|por mayor|al por mayor|precio\s+mayorista|x\s+mayor/.test(m);
}

function esSeguimientoPresupuesto(m, estado) {
  const tienePedido =
    estado.pedidoBorrador?.items?.length || estado.pedidoBorrador?.itemsPendientes?.length;
  if (!tienePedido) {
    return false;
  }
  return (
    /^(y\s+)?(el\s+)?presupuesto|no me mandaste|mandame el pdf|d[ií]a\s*y|anduvo|qu[eé] pas[oó]|ok\s+y/.test(
      m,
    ) || (mensajePidePresupuestoExplicito(m) && !extraerLineasPedidoPorNombre(m).length)
  );
}

function pidePrecioExplicito(m) {
  return /precio|cu[aá]nto\s+sale|cu[aá]nto\s+cuesta|cu[aá]nto\s+vale|cotiz|sale\s+el|sale\s+la/.test(m);
}

function esPreguntaPrecioSinProducto(m) {
  const t = trimLower(mensajeSafe(m));
  return (
    /^(y\s+)?(cu[aá]nto\s+sale|cu[aá]nto\s+cuesta|cu[aá]nto\s+vale|y\s+el\s+precio|precio\??)\s*[?.!]*$/.test(
      t,
    ) || /^y\s+cu[aá]nto/.test(t)
  );
}

function mensajeSafe(m) {
  return typeof m === 'string' ? m : '';
}

function esReferenciaOrdinal(m) {
  return (
    /\b(el|la)\s+(primero|segundo|tercero|cuarto|quinto|\d)\b/.test(m) ||
    /\b(primero|segundo|tercero|cuarto)\b/.test(m) ||
    /\bel\s+\d+\b/.test(m)
  );
}

function esConfirmacionSi(m) {
  const t = trimLower(m).replace(/[!?.]+/g, '').trim();
  return /^(s[ií]|dale|ok|okey|okay|perfecto|bueno|genial|claro|por\s+favor|mostr[aá]me|mostrame|ver)$/.test(
    t,
  );
}

function esConfirmacionNo(m) {
  const t = trimLower(m).replace(/[!?.]+/g, '').trim();
  return /^(no|nop|nah|despu[eé]s|ahora\s+no)$/.test(t);
}

function esDespedida(m) {
  const t = trimLower(m);
  return (
    /^(chau|adi[oó]s|hasta\s+luego|nos\s+vemos)\b/.test(t) ||
    (/^(gracias|muchas\s+gracias|genial\s+gracias)/.test(t) && t.length < 50)
  );
}

function esRecomendacion(m) {
  return (
    /cocinar\s+r[aá]pido|comer\s+r[aá]pido|algo\s+(f[aá]cil|pr[aá]ctico|r[aá]pido)|para\s+cocinar|rapido\s+y|listo\s+para/.test(
      m,
    ) || /necesito\s+algo\s+para/.test(m)
  );
}

function extraerLocalidadEnvio(mensaje) {
  const m = trimLower(mensaje);
  const match =
    m.match(/(?:a|en|para)\s+(yerba\s+buena|san\s+miguel|capital|taf[ií]\s*viejo|lules|ald|monteros|famaill[aá])/i) ||
    m.match(/(?:env[ií]an|llega|entregan)\s+(?:a\s+)?([a-záéíóúñ\s]{3,40})/i);
  return match?.[1]?.trim() ?? null;
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
  return { items, tipoCliente };
}

/**
 * Interpreta el turno actual usando mensaje + estado + historial reciente.
 * @returns {{ intencion, plan, slots, actualizarEstado, saludo }}
 */
export function interpretarTurno(mensaje, estado, historialMensajes = []) {
  const m = trimLower(mensaje);
  const plan = [];
  const slots = {};
  let intencion = INTENCION.OTRO;
  let actualizarEstado = {};
  let saludo = false;

  const datosContacto = extraerDatosContacto(mensaje);
  const pedidoNatural = extraerPedidoNaturalDesdeMensaje(mensaje);
  const lineasPedidoContacto = extraerLineasPedidoPorNombre(mensaje);
  const itemsPedidoMensaje =
    lineasPedidoContacto.length > 0 ? lineasPedidoContacto : pedidoNatural;

  if (datosContacto.tieneDatos && Object.keys(datosContacto.args).length > 0) {
    intencion = INTENCION.DATOS_CONTACTO;
    plan.push({ tool: 'actualizarLead', args: datosContacto.args });
    slots.datosContacto = datosContacto.args;

    if (itemsPedidoMensaje.length) {
      intencion = INTENCION.PRESUPUESTO;
      for (const item of itemsPedidoMensaje.slice(0, 6)) {
        plan.push({ tool: 'buscarProductos', args: { search: item.search.slice(0, 80), limit: 2 } });
      }
      actualizarEstado = {
        ...actualizarEstado,
        pedidoBorrador: {
          items: [],
          itemsPendientes: itemsPedidoMensaje,
        },
        intencionActual: INTENCION.PRESUPUESTO,
        ultimoTema: 'presupuesto',
        esperandoAccion: datosContacto.args.localidad ? null : 'localidad_para_presupuesto',
      };
      slots.registrarSeguimiento = {
        motivo: 'pedido_cantidades',
        notas: itemsPedidoMensaje
          .map((i) => `${i.cantidad} u. ${i.search}`)
          .join('; ')
          .slice(0, 500),
      };
    }

    if (datosContacto.args.localidad && estado.esperandoAccion === 'localidad_para_presupuesto') {
      intencion = INTENCION.PRESUPUESTO;
      slots.forzarPresupuesto = true;
      actualizarEstado = {
        ...actualizarEstado,
        zonaEnvio: datosContacto.args.localidad,
        ultimoTema: 'presupuesto',
        intencionActual: INTENCION.PRESUPUESTO,
        esperandoAccion: null,
      };
    } else if (
      datosContacto.args.localidad &&
      (estado.pedidoBorrador?.items?.length ||
        estado.pedidoBorrador?.itemsPendientes?.length ||
        estado.carritoSesion?.length ||
        estado.presupuestoIdActivo ||
        itemsPedidoMensaje.length)
    ) {
      intencion = INTENCION.PRESUPUESTO;
      slots.forzarPresupuesto = true;
      actualizarEstado = {
        ...actualizarEstado,
        zonaEnvio: datosContacto.args.localidad,
        ultimoTema: 'presupuesto',
        intencionActual: INTENCION.PRESUPUESTO,
        esperandoAccion: null,
      };
    }

    if (!itemsPedidoMensaje.length) {
      return { intencion, plan, slots, actualizarEstado, saludo: false };
    }
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (esDespedida(m)) {
    intencion = INTENCION.DESPEDIDA;
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (esConfirmacionSi(m) && estado.esperandoAccion === 'confirmar_recomendacion') {
    intencion = INTENCION.CONFIRMACION_SI;
    plan.push({ tool: 'buscarProductos', args: { search: 'ravioles', limit: 4 } });
    plan.push({ tool: 'buscarProductos', args: { search: 'ñoqui', limit: 4 } });
    actualizarEstado = { esperandoAccion: null, intencionActual: INTENCION.CATALOGO };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (esConfirmacionSi(m) && estado.esperandoAccion === 'confirmar_listado') {
    intencion = INTENCION.CONFIRMACION_SI;
    plan.push({
      tool: 'buscarProductos',
      args: estado.ultimaBusquedaTexto
        ? { search: estado.ultimaBusquedaTexto, limit: 8 }
        : { listarCatalogo: true, limit: 8 },
    });
    actualizarEstado = { esperandoAccion: null };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (esConfirmacionNo(m)) {
    intencion = INTENCION.CONFIRMACION_NO;
    actualizarEstado = { esperandoAccion: null };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (
    esReferenciaOrdinal(m) ||
    (esPreguntaPrecioSinProducto(m) && estado.ultimosProductosMostrados?.length)
  ) {
    const ref = esReferenciaOrdinal(m) ? m : m;
    const productoRef = productoPorReferencia(estado, ref) ?? estado.productoActual;
    if (productoRef?.id) {
      intencion = INTENCION.PRECIO_REFERENCIA;
      slots.productoReferencia = productoRef;
      plan.push({ tool: 'consultarPrecio', args: { productoId: productoRef.id, tipoCliente: 'minorista' } });
      actualizarEstado = {
        productoActual: productoRef,
        intencionActual: INTENCION.PRECIO,
        ultimoTema: 'precio',
      };
      return { intencion, plan, slots, actualizarEstado, saludo: false };
    }
  }

  if (esPreguntaPrecioSinProducto(m) && estado.productoActual?.id) {
    intencion = INTENCION.PRECIO_REFERENCIA;
    slots.productoReferencia = estado.productoActual;
    plan.push({
      tool: 'consultarPrecio',
      args: { productoId: estado.productoActual.id, tipoCliente: 'minorista' },
    });
    return { intencion, plan, slots, actualizarEstado: { intencionActual: INTENCION.PRECIO }, saludo: false };
  }

  if (esSaludoPuro(mensaje)) {
    intencion = INTENCION.SALUDO;
    saludo = true;
    return { intencion, plan, slots, actualizarEstado: { ultimoTema: 'saludo' }, saludo: true };
  }

  if (esSaludoCordial(m) && m.length < 80) {
    intencion = INTENCION.SALUDO_CORDIAL;
    saludo = true;
    return { intencion, plan, slots, actualizarEstado, saludo: true };
  }

  if (pideNovedades(m)) {
    intencion = INTENCION.PRECIO;
    plan.push({ tool: 'buscarProductos', args: { novedades: true } });
    actualizarEstado = { intencionActual: INTENCION.PRECIO, ultimoTema: 'novedades' };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (esSeguimientoPresupuesto(m, estado)) {
    intencion = INTENCION.PRESUPUESTO;
    actualizarEstado = { intencionActual: INTENCION.PRESUPUESTO, ultimoTema: 'presupuesto' };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  const pendientesRavioles = estado.pedidoBorrador?.itemsPendientes?.some((l) =>
    /^ravioles?\b/i.test(l.search.trim()),
  );
  if (
    pendientesRavioles &&
    /\bravioles?\b/i.test(m) &&
    /pollo|verdura|espinaca|ricota|carne/i.test(m)
  ) {
    intencion = INTENCION.PRESUPUESTO;
    const itemsPendientes = estado.pedidoBorrador.itemsPendientes.map((l) =>
      /^ravioles?\b/i.test(l.search.trim()) ? { ...l, search: mensaje.trim().slice(0, 80) } : l,
    );
    plan.push({
      tool: 'buscarProductos',
      args: { search: mensaje.trim().slice(0, 80), limit: 4 },
    });
    actualizarEstado = {
      pedidoBorrador: { ...estado.pedidoBorrador, itemsPendientes },
      esperandoAccion: 'localidad_para_presupuesto',
      ultimoTema: 'presupuesto',
    };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (pideCatalogo(m)) {
    intencion = INTENCION.CATALOGO;
    plan.push({ tool: 'buscarProductos', args: { listarCatalogo: true, limit: 10 } });
    actualizarEstado = { intencionActual: INTENCION.CATALOGO, ultimoTema: 'catalogo', esperandoAccion: null };
    return { intencion, plan, slots, actualizarEstado, saludo: esSaludoCordial(m) || /^hola\b/.test(m) };
  }

  if (esRecomendacion(m)) {
    intencion = INTENCION.RECOMENDACION;
    actualizarEstado = {
      intencionActual: INTENCION.RECOMENDACION,
      ultimoTema: 'recomendacion',
      esperandoAccion: 'confirmar_recomendacion',
      ultimaBusquedaTexto: 'rapido',
    };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  const costoEnvio = /cu[aá]nto\s+cuesta\s+(el\s+)?env[ií]o|tarifa\s+de\s+env[ií]o|costo\s+de\s+env[ií]o/.test(m);
  const localidad = extraerLocalidadEnvio(mensaje);
  if (costoEnvio && localidad) {
    intencion = INTENCION.COSTO_ENVIO;
    plan.push({ tool: 'buscarPoliticas', args: { consulta: mensaje.slice(0, 500) } });
    plan.push({
      tool: 'consultarEnvio',
      args: { localidad, departamento: 'Tucumán' },
    });
    actualizarEstado = { zonaEnvio: localidad, ultimoTema: 'envio' };
    return { intencion, plan, slots: { localidad }, actualizarEstado, saludo: false };
  }

  if (/env[ií]o|env[ií]an|entregas?|llega\s+a|mandan\s+a/.test(m) && localidad) {
    intencion = INTENCION.ENVIO_ZONA;
    plan.push({ tool: 'buscarPoliticas', args: { consulta: mensaje.slice(0, 500) } });
    plan.push({ tool: 'consultarEnvio', args: { localidad, departamento: 'Tucumán' } });
    actualizarEstado = { zonaEnvio: localidad, ultimoTema: 'envio' };
    return { intencion, plan, slots: { localidad }, actualizarEstado, saludo: false };
  }

  if (/env[ií]o|env[ií]an|hacen\s+env[ií]os|entregas?\s+a\s+domicilio/.test(m)) {
    intencion = INTENCION.ENVIO;
    plan.push({ tool: 'buscarPoliticas', args: { consulta: 'envios entregas zonas' } });
    actualizarEstado = { ultimoTema: 'envio' };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (
    /no me mandaste|no me enviaste|falta el presupuesto|d[oó]nde est[aá] el presupuesto/.test(m) &&
    (estado.pedidoBorrador?.items?.length || estado.pedidoBorrador?.itemsPendientes?.length)
  ) {
    intencion = INTENCION.PRESUPUESTO;
    actualizarEstado = { intencionActual: INTENCION.PRESUPUESTO, ultimoTema: 'presupuesto' };
    if (estado.pedidoBorrador?.itemsPendientes?.length) {
      for (const l of estado.pedidoBorrador.itemsPendientes) {
        plan.push({ tool: 'buscarProductos', args: { search: l.search.slice(0, 60), limit: 4 } });
      }
    }
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  const pedidoNaturalSolo = extraerPedidoNaturalDesdeMensaje(mensaje);
  if (pedidoNaturalSolo.length) {
    intencion = INTENCION.PRESUPUESTO;
    for (const l of pedidoNaturalSolo) {
      plan.push({ tool: 'buscarProductos', args: { search: l.search.slice(0, 60), limit: 4 } });
    }
    actualizarEstado = {
      pedidoBorrador: { items: [], itemsPendientes: pedidoNaturalSolo },
      esperandoAccion: 'localidad_para_presupuesto',
      intencionActual: INTENCION.PRESUPUESTO,
      ultimoTema: 'presupuesto',
    };
    slots.forzarPresupuesto = true;
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (
    (mensajePidePresupuestoExplicito(mensaje) ||
      /agreg(a|á).*carrito|sum(a|á).*presupuesto|arm(a|á).*presupuesto|cerr(a|á).*pedido/.test(m)) &&
    (estado.carritoSesion?.length ||
      estado.pedidoBorrador?.items?.length ||
      estado.pedidoBorrador?.itemsPendientes?.length)
  ) {
    intencion = INTENCION.PRESUPUESTO;
    slots.forzarPresupuesto = true;
    actualizarEstado = {
      intencionActual: INTENCION.PRESUPUESTO,
      ultimoTema: 'presupuesto',
      esperandoAccion: estado.zonaEnvio ? null : 'localidad_para_presupuesto',
    };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (
    mensajePidePresupuestoExplicito(mensaje) &&
    !pedidoNaturalSolo.length &&
    (estado.productosEnContexto?.length ?? 0) > 0
  ) {
    intencion = INTENCION.PRESUPUESTO;
    slots.forzarPresupuesto = true;
    actualizarEstado = {
      pedidoBorrador: {
        items: [],
        itemsPendientes: estado.productosEnContexto.map((p) => ({
          search: p.nombre,
          cantidad: 1,
        })),
      },
      intencionActual: INTENCION.PRESUPUESTO,
      ultimoTema: 'presupuesto',
      esperandoAccion: estado.zonaEnvio ? null : 'localidad_para_presupuesto',
    };
    for (const p of estado.productosEnContexto.slice(0, 6)) {
      plan.push({ tool: 'buscarProductos', args: { search: p.nombre?.slice(0, 60), limit: 1 } });
    }
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  const lineasPedido = extraerLineasPedidoPorNombre(mensaje);
  if (lineasPedido.length && (mensajePidePresupuestoExplicito(mensaje) || lineasPedido.length >= 2)) {
    intencion = INTENCION.PRESUPUESTO;
    for (const l of lineasPedido) {
      plan.push({ tool: 'buscarProductos', args: { search: l.search.slice(0, 60), limit: 4 } });
    }
    actualizarEstado = {
      pedidoBorrador: { items: [], itemsPendientes: lineasPedido },
      esperandoAccion: 'localidad_para_presupuesto',
      intencionActual: INTENCION.PRESUPUESTO,
      ultimoTema: 'presupuesto',
    };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (/presupuesto|cotizaci[oó]n/.test(m)) {
    intencion = INTENCION.PRESUPUESTO;
    const { items, tipoCliente } = extraerItemsPresupuesto(mensaje);
    if (items.length) {
      plan.push({ tool: 'calcularPresupuesto', args: { items, tipoCliente } });
    }
    actualizarEstado = { intencionActual: INTENCION.PRESUPUESTO, ultimoTema: 'presupuesto' };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (
    (/\d+\s*(unidades?|un\b|kg|cajas?)|quiero\s+comprar|armar\s+pedido|hacer\s+pedido/.test(m) &&
      !extraerPedidoNaturalDesdeMensaje(mensaje).length) ||
    (/\bproducto\s+\d+/i.test(m) && /\d+\s*(unidades?|un\b|kg)/.test(m))
  ) {
    intencion = INTENCION.PEDIDO;
    const { items, tipoCliente } = extraerItemsPresupuesto(mensaje);
    if (items.length) {
      plan.push({ tool: 'calcularPresupuesto', args: { items, tipoCliente } });
    }
    actualizarEstado = { intencionActual: INTENCION.PEDIDO, ultimoTema: 'pedido' };
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  if (/stock|disponible|hay\s+stock|qued[aó]/.test(m) && !pideCatalogo(m)) {
    intencion = INTENCION.STOCK;
    const frases = extraerFrasesProducto(mensaje);
    if (frases.length) {
      for (const frase of frases.slice(0, 2)) {
        plan.push({ tool: 'buscarProductos', args: { search: frase.slice(0, 80), limit: 1 } });
      }
    } else if (estado.productoActual?.id) {
      plan.push({ tool: 'consultarStock', args: { productoId: estado.productoActual.id } });
    }
    return { intencion, plan, slots, actualizarEstado: { ultimoTema: 'stock' }, saludo: false };
  }

  if (pidePrecioMayorista(m)) {
    intencion = INTENCION.PRECIO;
    const { refs, buscar } = resolverProductosParaMayorista(mensaje, estado);
    const cantidades = extraerPedidoNaturalDesdeMensaje(mensaje);

    for (const p of refs.slice(0, 8)) {
      const qty =
        cantidades.find((c) =>
          p.nombre?.toLowerCase().includes(c.search.toLowerCase().slice(0, 6)),
        )?.cantidad ?? 1;
      plan.push({
        tool: 'consultarPrecio',
        args: { productoId: p.id, tipoCliente: 'mayorista', cantidad: qty },
      });
    }
    for (const search of buscar) {
      plan.push({ tool: 'buscarProductos', args: { search: search.slice(0, 80), limit: 1 } });
    }

    if (refs.length || buscar.length) {
      actualizarEstado = { intencionActual: INTENCION.PRECIO, ultimoTema: 'precio_mayorista' };
      slots.consultaMayorista = true;
      return { intencion, plan, slots, actualizarEstado, saludo: false };
    }
  }

  if (pidePrecioExplicito(m)) {
    intencion = INTENCION.PRECIO;

    if (esConsultaPrecioGenerica(mensaje)) {
      actualizarEstado = {
        intencionActual: INTENCION.PRECIO,
        ultimoTema: 'precio_generico',
        esperandoAccion: 'elegir_producto_precio',
      };
      slots.precioGenerico = true;
      return { intencion, plan, slots, actualizarEstado, saludo: /^hola\b/.test(m) || esSaludoCordial(m) };
    }

    if (mensajeReferenciaContextoSesion(mensaje)) {
      const refs = productosEnSesion(estado);
      for (const p of refs.slice(0, 8)) {
        plan.push({
          tool: 'consultarPrecio',
          args: { productoId: p.id, tipoCliente: 'minorista' },
        });
      }
      if (refs.length) {
        actualizarEstado = { intencionActual: INTENCION.PRECIO, ultimoTema: 'precio' };
        return { intencion, plan, slots, actualizarEstado, saludo: false };
      }
    }

    const frases = extraerFrasesProducto(mensaje);
    if (frases.length) {
      for (const frase of frases.slice(0, 3)) {
        plan.push({ tool: 'buscarProductos', args: { search: frase.slice(0, 80), limit: 2 } });
      }
    } else {
      const { terminoPrincipal } = extraerBusquedaProductoDesdeMensaje(mensaje);
      if (
        terminoPrincipal &&
        !/^(hola|buenas|consultar|precios?|esos|estos|productos?)$/.test(terminoPrincipal) &&
        !mensajeReferenciaContextoSesion(mensaje)
      ) {
        plan.push({ tool: 'buscarProductos', args: { search: terminoPrincipal, limit: 3 } });
      } else if (estado.productoActual?.id) {
        plan.push({
          tool: 'consultarPrecio',
          args: { productoId: estado.productoActual.id, tipoCliente: 'minorista' },
        });
      }
    }
    actualizarEstado = { intencionActual: INTENCION.PRECIO, ultimoTema: 'precio' };
    return { intencion, plan, slots, actualizarEstado, saludo: /^hola\b/.test(m) };
  }

  if (esSaludoCordial(m) || /^hola\b/.test(m)) {
    saludo = true;
  }

  const frases = extraerFrasesProducto(mensaje);
  if (frases.length) {
    intencion = INTENCION.BUSQUEDA_PRODUCTO;
    for (const frase of frases.slice(0, 3)) {
      plan.push({ tool: 'buscarProductos', args: { search: frase.slice(0, 80), limit: 4 } });
    }
    actualizarEstado = { ultimaBusquedaTexto: frases[0], ultimoTema: 'productos' };
    return { intencion, plan, slots, actualizarEstado, saludo };
  }

  const ultimoUser = [...historialMensajes].reverse().find((x) => x.rol === 'user');
  if (ultimoUser && esConfirmacionSi(m) && estado.ultimosProductosMostrados?.length) {
    intencion = INTENCION.CONFIRMACION_SI;
    return { intencion, plan, slots, actualizarEstado, saludo: false };
  }

  intencion = INTENCION.OTRO;
  return { intencion, plan, slots, actualizarEstado, saludo };
}
