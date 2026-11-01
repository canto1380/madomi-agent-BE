import { esConsultaPrecioGenerica } from '../../intent/consultaPrecioGenerica.js';
import { extraerBusquedaProductoDesdeMensaje } from '../../intent/busquedaProducto.js';

const TERMINOS_SIN_PRODUCTO = new Set([
  'para',
  'por',
  'ver',
  'saber',
  'consultar',
  'consulta',
  'precio',
  'precios',
  'producto',
  'productos',
  'hola',
  'buenas',
  'quiero',
  'queria',
  'quería',
  'necesito',
  'algunos',
  'algunas',
  'varios',
  'varias',
  'algun',
  'alguna',
  'sobre',
]);

function tokensProductoConcretos(mensaje) {
  const { terminos } = extraerBusquedaProductoDesdeMensaje(mensaje);
  return terminos.filter((t) => !TERMINOS_SIN_PRODUCTO.has(t) && t.length >= 4);
}

function esConsultaPreciosSinProductoConcreto(mensaje) {
  if (esConsultaPrecioGenerica(mensaje)) {
    return true;
  }
  const m = mensaje.trim().toLowerCase();
  const pidePrecio =
    /precio|precios|cu[aá]nto\s+sale|cu[aá]nto\s+cuesta|cotiz/.test(m) ||
    /consult(ar|a)\s+(los\s+)?precios?/.test(m);
  if (!pidePrecio) {
    return false;
  }
  return tokensProductoConcretos(mensaje).length === 0;
}

/** "consultar sobre algunos productos", "info de productos", sin nombre concreto. */
function esConsultaProductosSinNombreConcreto(mensaje) {
  const m = mensaje.trim().toLowerCase();
  const pideProductos =
    /consult(ar|a)\s+(sobre\s+)?(algunos|varios|algunas)?\s*(los\s+)?productos?/.test(m) ||
    /(informaci[oó]n|info)\s+(sobre\s+)?(algunos\s+)?productos?/.test(m) ||
    (/quer[ií]a?\s+(consultar|saber|ver)/.test(m) && /productos?/.test(m));
  if (!pideProductos) {
    return false;
  }
  return tokensProductoConcretos(mensaje).length === 0;
}

function esConsultaComercialVaga(mensaje) {
  return esConsultaPreciosSinProductoConcreto(mensaje) || esConsultaProductosSinNombreConcreto(mensaje);
}

function productosUnicosEnSesion(estado) {
  const map = new Map();
  for (const p of [...(estado.productosEnContexto ?? []), ...(estado.ultimosProductosMostrados ?? [])]) {
    if (p?.id != null) {
      map.set(String(p.id), p);
    }
  }
  return [...map.values()];
}

/** "10 unidades de cada", "10 de cada uno", "necesito 10 de cada producto". */
export function extraerCantidadPorProductoEnContexto(mensaje) {
  const m = mensaje.trim().toLowerCase();
  if (!/(cada\s+(?:uno|producto)|de\s+cada|x\s+cada|unidades?\s+de\s+cada)/.test(m)) {
    return null;
  }

  const explicit =
    m.match(/(\d+(?:[.,]\d+)?)\s*(?:unidades?\s+)?(?:de\s+)?(?:cada|x\s+cada)/i) ??
    m.match(/(\d+(?:[.,]\d+)?)\s+de\s+cada/i) ??
    m.match(/(?:necesito|quiero|ped[ií]|mand[aá])\s+(\d+(?:[.,]\d+)?)/i);

  if (!explicit) {
    return null;
  }

  const cantidad = Number(String(explicit[1]).replace(',', '.'));
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return null;
  }
  return cantidad;
}

const RESPUESTA_CONSULTA_COMERCIAL_VAGA =
  '¡Hola! Te ayudo con productos, precios y envíos. Decime qué te interesa (por nombre o cantidad, ej. "10 ravioles de ricota" o "bondiola y humita") y te paso el detalle. Si todavía no tenés claro cuáles, también puedo contarte el catálogo o las novedades. ¿Qué querés consultar?';

/**
 * Atajos sin Cursor para turnos frecuentes que fallaban en JSON.
 * @returns {{ tipo: 'respuesta', texto: string } | { tipo: 'tools', llamadas: object[], formatear: 'presupuesto' } | null}
 */
export function resolverAsistenciaTurnoDeterministico({ mensajeUsuario, estado }) {
  const mensaje = mensajeUsuario?.trim() ?? '';
  if (!mensaje) {
    return null;
  }

  if (esConsultaComercialVaga(mensaje)) {
    return { tipo: 'respuesta', texto: RESPUESTA_CONSULTA_COMERCIAL_VAGA };
  }

  const cantidad = extraerCantidadPorProductoEnContexto(mensaje);
  const productos = productosUnicosEnSesion(estado);
  if (cantidad != null && productos.length >= 1) {
    const items = productos.slice(0, 8).map((p) => ({
      productoId: String(p.id),
      cantidad,
    }));
    return {
      tipo: 'tools',
      llamadas: [{ nombre: 'calcularPresupuesto', args: { items, tipoCliente: 'minorista' } }],
      formatear: 'presupuesto',
    };
  }

  return null;
}

export function formatearRespuestaPresupuestoDesdeTools(resultadosTools, { leadTieneLocalidad }) {
  const pres = resultadosTools.find((r) => r.tool === 'calcularPresupuesto');
  if (!pres?.result?.ok) {
    if (pres?.result?.error === 'PRODUCTO_NO_DISPONIBLE') {
      return 'No pude armar el presupuesto porque algún producto ya no está disponible. ¿Podés repetir los nombres?';
    }
    return 'No pude calcular el presupuesto con esos datos. Decime producto y cantidad de nuevo, por favor.';
  }

  const p = pres.result;
  const detalle = (p.items ?? [])
    .map((i) => {
      const sub =
        i.subtotalLinea != null ? `$${i.subtotalLinea} ARS` : 'precio a confirmar';
      return `- ${i.nombreSnapshot} x ${i.cantidad}: ${sub}`;
    })
    .join('\n');

  let texto = `Listo, armé el presupuesto con ${p.items?.length ?? 0} producto(s):\n${detalle}\n\nTotal estimado: $${p.total} ARS`;
  if (p.hayPrecioPendiente) {
    texto += ' (algunos ítems tienen precio pendiente de carga en el sistema)';
  }
  texto += '.';

  if (!leadTieneLocalidad) {
    texto +=
      '\n\nPara sumar envío o generarte el PDF completo, decime tu localidad o barrio en Tucumán (y tu teléfono si aún no lo tenemos).';
  }

  return texto;
}
