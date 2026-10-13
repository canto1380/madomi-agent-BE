export function inferirAccionesDesdeLead(lead, presupuestoId = null, pedidoId = null) {
  const acciones = [];
  const datos = lead.datosCapturados ?? {};

  if (presupuestoId) {
    acciones.push({ tipo: 'mostrar_presupuesto', presupuestoId: String(presupuestoId) });
  }
  if (pedidoId) {
    acciones.push({ tipo: 'mostrar_pedido', pedidoId: String(pedidoId) });
  }

  const enFlujoCierre = Boolean(presupuestoId || pedidoId);
  if (enFlujoCierre && !datos.telefono && !lead.clienteId) {
    acciones.push({ tipo: 'solicitar_dato', campo: 'telefono' });
  } else if (enFlujoCierre && !datos.localidad && !lead.localidad) {
    acciones.push({ tipo: 'solicitar_dato', campo: 'localidad' });
  }

  return acciones;
}
