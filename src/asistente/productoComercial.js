export function ofertaVigente(producto, ahora = new Date()) {
  if (producto.ofertaPorcentaje == null || producto.ofertaPorcentaje <= 0) {
    return false;
  }
  if (producto.ofertaDesde && ahora < producto.ofertaDesde) {
    return false;
  }
  if (producto.ofertaHasta && ahora > producto.ofertaHasta) {
    return false;
  }
  return true;
}

export function calcularPrecioConOferta(precioBase, producto, ahora = new Date()) {
  if (precioBase == null) {
    return null;
  }
  const base = Number(precioBase);
  if (!ofertaVigente(producto, ahora)) {
    return base;
  }
  const descuento = (base * producto.ofertaPorcentaje) / 100;
  return Math.round((base - descuento) * 100) / 100;
}

/**
 * Define si aplica tarifa mayorista por declaración del cliente o por umbral de cantidad.
 */
export function resolverTipoClientePrecio(producto, { tipoCliente = 'minorista', cantidad = null } = {}) {
  if (tipoCliente === 'mayorista') {
    return 'mayorista';
  }
  const umbral = producto.cantidadMinimaMayorista;
  if (umbral != null && umbral > 0 && cantidad != null && Number(cantidad) >= umbral) {
    return 'mayorista';
  }
  return 'minorista';
}

export function obtenerPrecioBase(producto, tipoCliente = 'minorista', cantidad = null) {
  const tipo = resolverTipoClientePrecio(producto, { tipoCliente, cantidad });
  if (tipo === 'mayorista') {
    return producto.precioMayorista;
  }
  return producto.precioMinorista;
}

export function mapearProductoComercialTool(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    descripcion: producto.descripcion,
    unidadStock: producto.unidadStock,
    stockUnidades: producto.stockUnidades,
    cantidadMinimaMayorista: producto.cantidadMinimaMayorista,
  };
}
