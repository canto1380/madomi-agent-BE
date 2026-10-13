import { INTENCION } from './interpretarTurno.js';
import { formatearRespuestaEnvio } from './formatearPoliticasEnvio.js';

function uniqProductos(resultadosTools) {
  const map = new Map();
  for (const r of resultadosTools.filter((x) => x.tool === 'buscarProductos')) {
    for (const p of r.result?.productos ?? []) {
      map.set(p.id, p);
    }
  }
  return [...map.values()];
}

function precios(resultadosTools) {
  return resultadosTools.filter((r) => r.tool === 'consultarPrecio' && r.result?.encontrado);
}

function stocks(resultadosTools) {
  return resultadosTools.filter((r) => r.tool === 'consultarStock' && r.result?.encontrado);
}

function formatearListaProductos(productos, numerada = true) {
  return productos
    .slice(0, 8)
    .map((p, i) => {
      const n = numerada ? `${i + 1}. ` : '• ';
      const cat = p.categoria ? ` (${p.categoria})` : '';
      return `${n}${p.nombre}${cat}`;
    })
    .join('\n');
}

/**
 * Redacta respuesta cercana según intención, resultados de tools y estado.
 */
export function redactarRespuestaConversacional({
  intencion,
  saludo,
  resultadosTools,
  empresaNombre,
  estado,
  slots,
  leadDatos,
}) {
  const partes = [];
  const productos = uniqProductos(resultadosTools);
  const listaPrecios = precios(resultadosTools);
  const listaStock = stocks(resultadosTools);
  const leadUpdate = resultadosTools.find((r) => r.tool === 'actualizarLead');
  const politicas = resultadosTools.find((r) => r.tool === 'buscarPoliticas');
  const envio = resultadosTools.find((r) => r.tool === 'consultarEnvio');
  const presupuesto = resultadosTools.find((r) => r.tool === 'calcularPresupuesto');
  const pdfPresupuesto = resultadosTools.find((r) => r.tool === 'generarPresupuestoPdf');

  if (saludo && intencion === INTENCION.SALUDO) {
    partes.push(
      `¡Hola! 👋 ¿Cómo estás? Soy el asistente de ${empresaNombre}. ¿En qué puedo ayudarte hoy?`,
    );
    return partes.join('\n\n');
  }

  if (
    slots?.precioGenerico ||
    (intencion === INTENCION.PRECIO && estado.ultimoTema === 'precio_generico')
  ) {
    partes.push(
      saludo
        ? `¡Hola! Con gusto te ayudo con precios.`
        : 'Te ayudo con los precios.',
    );
    partes.push(
      'Decime el nombre del producto (ej. ravioles de ricota, bondiola, humita) o escribí "productos nuevos" para ver lanzamientos. Si preferís, pedime el listado del catálogo.',
    );
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.SALUDO_CORDIAL || (saludo && partes.length === 0)) {
    partes.push(`¡Hola! Muy bien, gracias por escribir. ¿En qué te puedo ayudar con nuestros productos?`);
  }

  if (
    (intencion === INTENCION.DATOS_CONTACTO || leadUpdate?.result?.ok) &&
    intencion !== INTENCION.PRESUPUESTO &&
    intencion !== INTENCION.PEDIDO
  ) {
    const dc = leadUpdate?.result?.datosCapturados ?? {};
    const dcSlots = slots?.datosContacto ?? {};
    const primerNombre = dc.nombre ?? dcSlots.nombre ?? slots?.nombre;
    const apellido = dc.apellido ?? dcSlots.apellido ?? slots?.apellido;
    const nombreCompleto = [primerNombre, apellido].filter(Boolean).join(' ');

    if (leadUpdate?.result?.ok) {
      if (pdfPresupuesto?.result?.pdfUrl) {
        const p = presupuesto?.result;
        partes.push(
          `Perfecto${primerNombre ? `, ${primerNombre}` : ''}. Te armé el presupuesto${p?.total != null ? ` por $${Number(p.total).toLocaleString('es-AR')} ARS` : ''}. Descargalo acá: ${pdfPresupuesto.result.pdfUrl}`,
        );
        partes.push(
          'Si querés ajustar cantidades o sumar productos, decime y regeneramos el PDF. Para confirmar el pedido, escribí "confirmo el pedido".',
        );
        return partes.join('\n\n');
      }
      if (presupuesto?.result?.ok && Number(presupuesto.result.total) > 0) {
        partes.push(
          `Perfecto${primerNombre ? `, ${primerNombre}` : ''}. Tu presupuesto quedó en $${Number(presupuesto.result.total).toLocaleString('es-AR')} ARS. Decime "mandame el PDF" y te paso el link.`,
        );
        return partes.join('\n\n');
      }
      if (nombreCompleto && dc.telefono && dc.localidad) {
        if (
          estado.pedidoBorrador?.itemsPendientes?.length ||
          estado.carritoSesion?.length ||
          estado.esperandoAccion === 'localidad_para_presupuesto'
        ) {
          partes.push(
            `Perfecto, ${primerNombre}, anoté teléfono y localidad. Estoy cerrando tu presupuesto; si no ves el total en un momento, pedime "mandame el PDF".`,
          );
        } else {
          partes.push(
            `Perfecto, ${primerNombre}, anoté tu teléfono y localidad. Decime productos y cantidades (ej. "10 bondiola") o pedime "armame el presupuesto" y te lo genero acá en el chat.`,
          );
        }
      } else if (nombreCompleto && dc.telefono) {
        partes.push(
          `Gracias, ${primerNombre}. Ya tengo tu teléfono. ¿En qué barrio o localidad estarías para el envío?`,
        );
      } else if (nombreCompleto) {
        partes.push(
          `¡Un gusto, ${primerNombre}! Anoté tu nombre. ¿Me pasás un teléfono o WhatsApp y la localidad para coordinar?`,
        );
      } else if (dcSlots.telefono || dc.telefono) {
        partes.push('Gracias, guardé tu teléfono. ¿En qué barrio o localidad estarías para el envío o presupuesto?');
      } else {
        partes.push('Listo, guardé tus datos. ¿En qué más te ayudo?');
      }
      return partes.join('\n\n');
    }

    if (intencion === INTENCION.DATOS_CONTACTO && nombreCompleto) {
      partes.push(
        `¡Hola, ${primerNombre}! ¿Me compartís un teléfono o WhatsApp y tu localidad para seguir con el pedido o el envío?`,
      );
      return partes.join('\n\n');
    }
  }

  if (intencion === INTENCION.DESPEDIDA || intencion === INTENCION.AGRADECIMIENTO) {
    partes.push('¡Gracias a vos! Cualquier cosa, escribinos de nuevo. ¡Que disfrutes las pastas! 🍝');
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.CONFIRMACION_NO) {
    partes.push('Sin problema. Cuando quieras retomamos. ¿Te ayudo con otra consulta?');
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.RECOMENDACION) {
    partes.push(
      'Claro. Tenemos pastas listas para cocinar que suelen ir muy bien si querés algo rico y práctico. ¿Querés que te muestre las opciones disponibles?',
    );
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.CONFIRMACION_SI && productos.length && estado.ultimoTema === 'recomendacion') {
    partes.push(
      `Perfecto. Estas son algunas opciones que te pueden servir:\n\n${formatearListaProductos(productos)}\n\n¿Querés el precio de alguna? Podés decir "el segundo" o el nombre.`,
    );
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.CATALOGO || (intencion === INTENCION.CONFIRMACION_SI && productos.length)) {
    if (productos.length) {
      partes.push(
        `¡Tenemos bastante variedad! 🍝 Algunas opciones:\n\n${formatearListaProductos(productos)}\n\n¿Querés precio de alguna? Decime el número, el nombre o el tipo (ravioles, ñoquis, etc.).`,
      );
    } else {
      partes.push(
        'Trabajamos con pastas frescas (ravioles, sorrentinos, ñoquis, fideos y más). Contame qué buscás — por ejemplo ravioles de ricota o bondiola — y te ayudo a encontrarlo.',
      );
    }
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.PRECIO_REFERENCIA && listaPrecios.length) {
    const p = listaPrecios[0].result;
    partes.push(
      `${p.nombre}: $${Number(p.precioFinal).toLocaleString('es-AR')} ARS (${p.tipoCliente}${p.ofertaActiva ? ', con oferta activa' : ''}). ¿Te armo presupuesto o sumamos otra cosa?`,
    );
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.PRECIO || intencion === INTENCION.BUSQUEDA_PRODUCTO) {
    if (estado.ultimoTema === 'novedades' && (listaPrecios.length || productos.length)) {
      partes.push(
        'Estos son los lanzamientos de la sección Lo último (los mismos que ves en la web). Si buscás otro producto del catálogo, decime el nombre y lo sumamos.',
      );
    }
    if (listaPrecios.length) {
      const vistos = new Set();
      for (const pr of listaPrecios) {
        const p = pr.result;
        if (vistos.has(p.productoId)) {
          continue;
        }
        vistos.add(p.productoId);
        if (p.tipoCliente === 'mayorista') {
          const unidad = p.unidadStock ?? 'unidades';
          const minMay = p.cantidadMinimaMayorista;
          const sufijoMin =
            minMay != null && minMay > 0
              ? ` (mínimo ${minMay} ${unidad} para precio mayorista)`
              : '';
          if (p.precioFinal != null) {
            partes.push(
              `${p.nombre} — mayorista: $${Number(p.precioFinal).toLocaleString('es-AR')} ARS${sufijoMin}${p.ofertaActiva ? ', con oferta' : ''}.`,
            );
          } else if (p.precioMayoristaDisponible === false) {
            partes.push(
              `${p.nombre}: no hay precio mayorista cargado${minMay ? ` (mín. ${minMay} ${unidad} cuando esté disponible)` : ''}; el equipo comercial te confirma la cotización.`,
            );
          } else {
            partes.push(`${p.nombre}: el precio mayorista lo confirma el equipo comercial.`);
          }
          continue;
        }
        if (p.precioFinal != null) {
          partes.push(
            `${p.nombre}: $${Number(p.precioFinal).toLocaleString('es-AR')} ARS (minorista${p.ofertaActiva ? ', con oferta' : ''}).`,
          );
        } else {
          partes.push(`${p.nombre}: el precio lo confirma el equipo comercial; puedo tomarte los datos y te llamamos.`);
        }
      }
    }
    if (productos.length && !listaPrecios.length) {
      partes.push(
        `Encontré:\n${formatearListaProductos(productos)}\n\n¿Cuál te interesa? Decime el número o el nombre y te paso el precio.`,
      );
    }
    if (!productos.length && !listaPrecios.length) {
      partes.push(
        'No ubiqué ese producto en el catálogo comercial. ¿Podés decirme el nombre como figura en la lista o la categoría (ravioles, ñoquis, etc.)?',
      );
    }
    if (listaPrecios.length && estado.ultimoTema !== 'precio_mayorista') {
      partes.push(
        '¿Querés que arme un presupuesto con cantidades y envío a tu localidad? Decime productos y unidades, o pedime "armame el presupuesto".',
      );
    }
    if (listaPrecios.length && estado.ultimoTema === 'precio_mayorista') {
      const sinMayorista = listaPrecios.some(
        (pr) => pr.result?.tipoCliente === 'mayorista' && pr.result?.precioMayoristaDisponible === false,
      );
      if (sinMayorista) {
        partes.push(
          'Si me pasás cantidades aproximadas y tu teléfono, anotamos el pedido y el equipo comercial te contacta con la cotización mayorista.',
        );
      } else {
        partes.push(
          '¿Armamos presupuesto mayorista con cantidades? Decime unidades por producto y tu localidad.',
        );
      }
    }
    return partes.filter(Boolean).join('\n\n');
  }

  if (intencion === INTENCION.STOCK && listaStock.length) {
    for (const s of listaStock) {
      const r = s.result;
      partes.push(
        `${r.nombre}: ${r.stockDisponible ?? r.stockUnidades} ${r.unidadStock} disponibles${r.disponible ? '' : ' (sin stock por ahora)'}.`,
      );
    }
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.ENVIO || intencion === INTENCION.ENVIO_ZONA || intencion === INTENCION.COSTO_ENVIO) {
    partes.push(
      formatearRespuestaEnvio({
        politicasTool: politicas,
        envioTool: envio,
        intencionCosto: intencion === INTENCION.COSTO_ENVIO,
      }),
    );
    if (envio?.result?.requiereValidacionManual) {
      partes.push('Para tu localidad conviene que logística lo confirme en un momento; con tu teléfono te avisamos.');
    }
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.PRESUPUESTO || intencion === INTENCION.PEDIDO) {
    if (pdfPresupuesto?.result?.pdfUrl) {
      const p = presupuesto?.result;
      partes.push(
        `Listo, te armé el presupuesto${p?.total != null ? ` por $${Number(p.total).toLocaleString('es-AR')} ARS` : ''}. Podés verlo acá: ${pdfPresupuesto.result.pdfUrl}`,
      );
      partes.push(
        'El link también queda guardado en tu conversación. Para confirmar compra, escribí "confirmo el pedido" o seguinos por WhatsApp con ese PDF.',
      );
      return partes.join('\n\n');
    }
    if (presupuesto?.result?.ok) {
      const p = presupuesto.result;
      if (p.total > 0) {
        partes.push(
          `Armé tu presupuesto por $${Number(p.total).toLocaleString('es-AR')} ARS. Si querés el PDF en un link, decime "mandame el PDF".`,
        );
      } else if (p.hayPrecioPendiente) {
        partes.push(
          'Tengo anotados los productos y cantidades, pero falta confirmar algún precio o la variedad exacta (ej. qué ravioles). Si ya lo aclaraste, pasame localidad y reintento el presupuesto, o pedime "mandame el PDF" cuando esté listo.',
        );
      } else {
        partes.push('Generé el borrador del presupuesto; decime "mandame el PDF" para recibir el link.');
      }
      return partes.join('\n\n');
    }
    if (
      estado.esperandoAccion === 'localidad_para_presupuesto' &&
      (estado.pedidoBorrador?.itemsPendientes?.length || estado.pedidoBorrador?.items?.length)
    ) {
      partes.push(
        'Perfecto, anoté los productos y cantidades. Pasame barrio o localidad (ej. San Miguel de Tucumán) y te armo el presupuesto con envío.',
      );
      return partes.join('\n\n');
    }
    partes.push(
      'Para armar presupuesto necesito producto y cantidad (ej. "Humita - 20 unidades"). Si ya los pasaste, decime tu localidad para cerrarlo.',
    );
    return partes.join('\n\n');
  }

  if (intencion === INTENCION.OTRO) {
    partes.push(
      'Puedo ayudarte con productos, precios, stock, envíos en Tucumán o un presupuesto. ¿Qué te gustaría saber?',
    );
    if (!leadDatos?.telefono) {
      partes.push('Cuando quieras avanzar con un pedido, pasame nombre, teléfono y localidad.');
    }
    return partes.join('\n\n');
  }

  if (!partes.length) {
    partes.push(`¿En qué más te ayudo con ${empresaNombre}?`);
  }

  return partes.join('\n\n');
}
