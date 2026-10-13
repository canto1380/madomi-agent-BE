export function formatearRespuestaOrchestrador({
  mensaje,
  saludo,
  pidePrecio,
  pideStock,
  pideEnvio,
  pidePresupuesto,
  pidePdfPresupuesto,
  pideCierreVenta,
  resultadosTools,
  empresaNombre,
}) {
  const lineas = [];

  if (saludo) {
    lineas.push(`¡Hola! Soy el asistente de ${empresaNombre}. ¿En qué te ayudo hoy?`);
  }

  const precios = resultadosTools.filter((r) => r.tool === 'consultarPrecio');
  const stocks = resultadosTools.filter((r) => r.tool === 'consultarStock');
  const politicas = resultadosTools.find((r) => r.tool === 'buscarPoliticas');
  const envio = resultadosTools.find((r) => r.tool === 'consultarEnvio');
  const presupuesto = resultadosTools.find((r) => r.tool === 'calcularPresupuesto');
  const pdfPresupuesto = resultadosTools.find((r) => r.tool === 'generarPresupuestoPdf');
  const cierreVenta = resultadosTools.find((r) => r.tool === 'cerrarVenta');
  const leadUpdate = resultadosTools.find((r) => r.tool === 'actualizarLead');

  const busquedas = resultadosTools.filter((r) => r.tool === 'buscarProductos');
  const productosUnicos = [];
  const idsVistos = new Set();
  for (const b of busquedas) {
    for (const p of b.result?.productos ?? []) {
      if (!idsVistos.has(p.id)) {
        idsVistos.add(p.id);
        productosUnicos.push(p);
      }
    }
  }

  if (leadUpdate?.result?.ok) {
    const dc = leadUpdate.result.datosCapturados ?? {};
    const nombre = [dc.nombre, dc.apellido].filter(Boolean).join(' ');
    const partes = [];
    if (nombre) {
      partes.push(`nombre: ${nombre}`);
    }
    if (dc.telefono) {
      partes.push(`teléfono: ${dc.telefono}`);
    }
    if (dc.localidad || leadUpdate.result.localidad) {
      partes.push(`localidad: ${dc.localidad ?? leadUpdate.result.localidad}`);
    }
    lineas.push(
      partes.length
        ? `Perfecto, guardé tus datos (${partes.join('; ')}). Te vamos a contactar para confirmar el pedido o el envío.`
        : 'Gracias, guardé tus datos de contacto.',
    );
  }

  if (productosUnicos.length) {
    const lista = productosUnicos
      .slice(0, 6)
      .map((p) => `• ${p.nombre} (id ${p.id}, ${p.categoria})`)
      .join('\n');
    lineas.push(`Encontré estos productos:\n${lista}`);
  } else if (busquedas.length && !leadUpdate?.result?.ok) {
    lineas.push('No encontré productos con ese criterio. ¿Podés decirme el nombre exacto o la categoría?');
  }

  for (const p of precios) {
    if (p.result?.encontrado && p.result.precioFinal != null) {
      lineas.push(
        `${p.result.nombre}: $${p.result.precioFinal} ARS (${p.result.tipoCliente}${p.result.ofertaActiva ? ', con oferta' : ''}).`,
      );
    } else if (p.result?.encontrado && p.result.precioFinal == null) {
      lineas.push(`${p.result.nombre}: el precio no está cargado en el sistema. Un vendedor puede confirmarlo.`);
    }
  }

  if (pidePrecio && precios.length === 0 && productosUnicos.length > 0) {
    lineas.push('Decime si sos consumidor final o mayorista y te detallo el precio del producto que te interesa.');
  }

  for (const s of stocks) {
    if (s.result?.encontrado) {
      lineas.push(
        `Stock ${s.result.nombre}: ${s.result.stockDisponible ?? s.result.stockUnidades} ${s.result.unidadStock} disponibles (${s.result.stockComprometido ? `${s.result.stockComprometido} comprometidas; ` : ''}${s.result.disponible ? 'hay stock' : 'sin stock por ahora'}).`,
      );
    }
  }

  if (politicas?.result?.chunks?.length) {
    const extracto = politicas.result.chunks
      .slice(0, 2)
      .map((c) => `**${c.titulo}:** ${c.texto.slice(0, 280)}…`)
      .join('\n\n');
    lineas.push(`Sobre envíos y plazos:\n${extracto}`);
  } else if (pideEnvio) {
    lineas.push(
      'Para confirmar costo y día de entrega a tu localidad, decime localidad y departamento (Tucumán) y un teléfono de contacto.',
    );
  }

  if (presupuesto?.result?.ok) {
    const p = presupuesto.result;
    const detalle = p.items
      ?.map(
        (i) =>
          `• ${i.nombreSnapshot} x ${i.cantidad}${i.precioUnitarioSnapshot != null ? `: $${i.subtotalLinea} ARS` : ' (precio a confirmar)'}`,
      )
      .join('\n');
    lineas.push(
      `Presupuesto borrador (${p.presupuestoId}):\n${detalle}\n**Total estimado:** $${p.total} ARS${p.hayPrecioPendiente ? ' (algunos precios pendientes de carga)' : ''}.`,
    );
  } else if (pidePresupuesto && !presupuesto?.result?.ok) {
    lineas.push(
      'Para armar el presupuesto indicame el código de producto (ej. 1002) y la cantidad (ej. 3 unidades).',
    );
  }

  if (pdfPresupuesto?.result?.ok) {
    lineas.push(
      `Listo, generé el PDF del presupuesto ${pdfPresupuesto.result.presupuestoId}.\nLink: ${pdfPresupuesto.result.pdfUrl}`,
    );
  } else if (pidePdfPresupuesto && pdfPresupuesto?.result?.error === 'STORAGE_NOT_CONFIGURED') {
    lineas.push(
      'No pude subir el PDF porque falta configurar Supabase en el servidor. El presupuesto sigue en borrador.',
    );
  } else if (pidePdfPresupuesto && pdfPresupuesto?.result?.error === 'PRESUPUESTO_NO_ENCONTRADO') {
    lineas.push('Primero armá un presupuesto (producto + cantidad) y después pedime el PDF.');
  }

  if (cierreVenta?.result?.ok) {
    lineas.push(
      `¡Gracias! Registré tu pedido (${cierreVenta.result.pedidoId}). Estado: ${cierreVenta.result.estadoLead.replace(/_/g, ' ')}.`,
    );
    if (cierreVenta.result.advertenciasStock?.length) {
      lineas.push(
        'Hay ítems con stock a confirmar; el equipo comercial te va a contactar para validar disponibilidad.',
      );
    }
  } else if (pideCierreVenta && cierreVenta?.result?.error === 'DATOS_CLIENTE_INCOMPLETOS') {
    lineas.push(
      'Para cerrar la compra necesito nombre, apellido, email, teléfono, dirección y localidad. Pasámelos en un mensaje.',
    );
  } else if (pideCierreVenta && cierreVenta?.result?.error === 'PRESUPUESTO_REQUERIDO') {
    lineas.push('Antes de confirmar la compra necesitamos un presupuesto armado.');
  }

  if (envio?.result?.requiereValidacionManual) {
    lineas.push('Tu zona puede requerir validación manual de logística; te contactará el equipo comercial.');
  }

  if (lineas.length === 0) {
    lineas.push(
      'Puedo ayudarte con precios, stock, productos y envíos en Tucumán. ¿Qué producto o localidad te interesa?',
    );
  }

  const datosCompletos =
    leadUpdate?.result?.ok &&
    leadUpdate.result.datosCapturados?.telefono &&
    (leadUpdate.result.datosCapturados?.localidad || leadUpdate.result.datosCapturados?.nombre);

  if (!datosCompletos && !leadUpdate?.result?.ok) {
    lineas.push('Si querés avanzar con un pedido, pasame nombre, teléfono y localidad cuando quieras.');
  }

  return lineas.join('\n\n');
}
