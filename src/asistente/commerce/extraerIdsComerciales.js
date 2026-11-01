export function extraerPresupuestoPedidoIds(resultadosTools) {
  const presupuestoResult =
    resultadosTools.find((r) => r.tool === 'calcularPresupuesto')?.result ??
    resultadosTools.find((r) => r.tool === 'generarPresupuestoPdf')?.result;
  const presupuestoId =
    presupuestoResult?.ok && presupuestoResult.presupuestoId ? presupuestoResult.presupuestoId : null;
  const cierreResult = resultadosTools.find((r) => r.tool === 'cerrarVenta')?.result;
  const pedidoId = cierreResult?.ok && cierreResult.pedidoId ? cierreResult.pedidoId : null;
  return { presupuestoId, pedidoId };
}

export function presupuestoIdFromTools(resultadosTools) {
  const p = resultadosTools.find((r) => r.tool === 'calcularPresupuesto')?.result;
  return p?.ok && p.presupuestoId ? p.presupuestoId : null;
}
