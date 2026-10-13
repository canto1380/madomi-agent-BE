import PDFDocument from 'pdfkit';
import { COLORES_MADOMI_PDF } from './layoutMadomiV1.js';
import { obtenerLayoutPresupuestoPdf } from './presupuestoPdfLayout.js';

function formatoMoneda(n) {
  if (n == null || Number.isNaN(n)) {
    return '—';
  }
  return `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatoFecha(d) {
  if (!d) {
    return '—';
  }
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function numeroPresupuestoDisplay(presupuesto) {
  const id = String(presupuesto._id ?? '');
  const corto = id.slice(-6).toUpperCase();
  return `N° 002-${corto.padStart(6, '0')}`;
}

function textoDerecha(doc, text, x, y, { fontSize = 10, color = COLORES_MADOMI_PDF.texto, width = 200 } = {}) {
  doc.fontSize(fontSize).fillColor(color);
  doc.text(text, x - width, y, { width, align: 'right' });
}

function etiquetaAmarilla(doc, label, x, y) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORES_MADOMI_PDF.acento)
    .text(label, x, y, { characterSpacing: 0.6 });
}

function handleDesdeSitioWeb(sitioWeb) {
  if (!sitioWeb?.trim()) {
    return null;
  }
  const host = sitioWeb
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
  const base = host.split('.')[0];
  return base ? `@${base}` : null;
}

/**
 * PDF vectorial estilo modelo Madomi (sin imagen de plantilla embebida).
 */
export async function renderPresupuestoPdfBuffer({
  presupuesto,
  cliente = null,
  contextoPdf,
}) {
  const layout = obtenerLayoutPresupuestoPdf();
  const C = COLORES_MADOMI_PDF;
  const ctx = contextoPdf ?? {};
  const logoBuffer = ctx.logoBuffer ?? null;
  const empresaNombre = ctx.empresaNombre ?? 'Madomi Pastas';

  const items = presupuesto.items ?? [];
  const subtotal = presupuesto.subtotal ?? 0;
  const ivaPct = ctx.ivaPorcentaje ?? 0;
  const impuestos = Math.round(subtotal * (ivaPct / 100) * 100) / 100;
  const total = presupuesto.total ?? subtotal + impuestos + (presupuesto.costoEnvio ?? 0);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { logo, titulo, numero, cliente: cli, fechas, bloquesMedio, tabla, totales, legales, pie } =
      layout;

    if (logoBuffer) {
      doc.image(logoBuffer, logo.x, logo.y, {
        fit: [logo.maxWidth, logo.maxHeight],
        align: 'left',
        valign: 'top',
      });
    } else {
      doc.fontSize(14).fillColor(C.texto).text(empresaNombre, logo.x, logo.y + 20, { width: 200 });
    }

    doc.font('Helvetica-Bold').fontSize(titulo.fontSize).fillColor(C.texto);
    textoDerecha(doc, titulo.label, titulo.x, titulo.y, { fontSize: titulo.fontSize, width: 220 });

    doc.font('Helvetica').fontSize(numero.fontSize).fillColor(C.textoClaro);
    textoDerecha(doc, numeroPresupuestoDisplay(presupuesto), numero.x, numero.y, {
      fontSize: numero.fontSize,
      width: 220,
    });

    etiquetaAmarilla(doc, cli.label, cli.x, cli.labelY);
    const nombreCliente = cliente
      ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ')
      : 'Consumidor final';
    doc.font('Helvetica-Bold').fontSize(18).fillColor(C.texto).text(nombreCliente, cli.x, cli.nombreY);
    doc.font('Helvetica').fontSize(10).fillColor(C.textoClaro).text('Comprador minorista', cli.x, cli.subtituloY);

    const hoy = new Date();
    textoDerecha(doc, `Fecha: ${formatoFecha(hoy)}`, fechas.x, fechas.yInicio, {
      fontSize: fechas.fontSize,
      width: 200,
    });
    textoDerecha(doc, `Vencimiento: ${formatoFecha(presupuesto.validezHasta)}`, fechas.x, fechas.yInicio + fechas.lineHeight, {
      fontSize: fechas.fontSize,
      width: 200,
    });

    etiquetaAmarilla(doc, 'PERSONA DE CONTACTO', bloquesMedio.contactoX, bloquesMedio.y);
    const tel = ctx.contacto?.telefono ?? '—';
    const mail = ctx.contacto?.email ?? '—';
    doc.font('Helvetica').fontSize(bloquesMedio.bodyFontSize).fillColor(C.texto);
    doc.text(`Teléfono: ${tel}`, bloquesMedio.contactoX, bloquesMedio.y + 14);
    doc.text(`Email: ${mail}`, bloquesMedio.contactoX, bloquesMedio.y + 14 + bloquesMedio.lineHeight);

    etiquetaAmarilla(doc, 'DATOS DE PAGO', bloquesMedio.pagoX, bloquesMedio.y);
    const lineasPago = ctx.datosPago?.lineas ?? [];
    let yPago = bloquesMedio.y + 14;
    for (const linea of lineasPago.slice(0, 4)) {
      textoDerecha(doc, linea, bloquesMedio.pagoX, yPago, {
        fontSize: bloquesMedio.bodyFontSize,
        width: 220,
      });
      yPago += bloquesMedio.lineHeight;
    }

    const tableY = tabla.y;
    doc.rect(tabla.x, tableY, tabla.width, tabla.headerHeight).fill(C.tablaHeader);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tablaHeaderTexto);
    const { cols, headers } = tabla;
    const colXs = [
      tabla.x + cols.num.x,
      tabla.x + cols.desc.x,
      tabla.x + cols.precio.x,
      tabla.x + cols.cant.x,
      tabla.x + cols.total.x,
    ];
    const colWs = [cols.num.w, cols.desc.w, cols.precio.w, cols.cant.w, cols.total.w];
    const aligns = ['center', 'left', 'right', 'center', 'right'];
    const headerTextY = tableY + Math.max(4, (tabla.headerHeight - 8) / 2);
    headers.forEach((h, i) => {
      doc.text(h, colXs[i], headerTextY, { width: colWs[i], align: aligns[i] });
    });

    let rowY = tableY + tabla.headerHeight;
    items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.rect(tabla.x, rowY, tabla.width, tabla.rowHeight).fill(C.filaZebra);
      }
      doc.font('Helvetica').fontSize(9).fillColor(C.texto);
      const precio = item.precioUnitarioSnapshot != null ? formatoMoneda(item.precioUnitarioSnapshot) : '—';
      const sub = item.subtotalLinea != null ? formatoMoneda(item.subtotalLinea) : '—';
      const cells = [
        String(idx + 1),
        item.nombreSnapshot ?? item.productoId,
        precio,
        String(item.cantidad ?? ''),
        sub,
      ];
      const cellY = rowY + Math.max(4, (tabla.rowHeight - 9) / 2);
      cells.forEach((cell, i) => {
        doc.text(cell, colXs[i], cellY, {
          width: colWs[i],
          align: aligns[i],
          ellipsis: true,
        });
      });
      rowY += tabla.rowHeight;
    });

    let yTot = rowY + 16;
    const totX = totales.x;
    const totW = totales.width;

    doc.font('Helvetica').fontSize(totales.labelFontSize).fillColor(C.texto);
    doc.text('Subtotal', totX, yTot, { width: totW - 80, align: 'left' });
    doc.text(formatoMoneda(subtotal), totX, yTot, { width: totW, align: 'right' });
    yTot += 18;
    doc.moveTo(totX, yTot).lineTo(totX + totW, yTot).strokeColor('#cccccc').lineWidth(0.5).stroke();
    yTot += 8;

    doc.text('Impuestos', totX, yTot, { width: totW - 80, align: 'left' });
    doc.text(`${ivaPct.toLocaleString('es-AR')}%`, totX + totW - 120, yTot, { width: 40, align: 'right' });
    doc.text(formatoMoneda(impuestos), totX, yTot, { width: totW, align: 'right' });
    yTot += 18;
    doc.moveTo(totX, yTot).lineTo(totX + totW, yTot).strokeColor('#cccccc').lineWidth(0.5).stroke();
    yTot += 6;

    doc.rect(totX, yTot, totW, totales.totalBarHeight).fill(C.totalBar);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
    doc.text('TOTAL', totX + 10, yTot + 8);
    doc.text(formatoMoneda(total), totX, yTot + 8, { width: totW - 10, align: 'right' });

    const yLeg = Math.max(yTot + 40, legales.y);
    etiquetaAmarilla(doc, 'CONDICIONES DE PAGO', legales.x, yLeg);
    doc.font('Helvetica').fontSize(legales.bodyFontSize).fillColor(C.textoClaro);
    doc.text(ctx.condicionesPago ?? '', legales.x, yLeg + 12, { width: legales.width, lineGap: 2 });

    const yOtros = yLeg + (legales.bloqueGap ?? 52);
    etiquetaAmarilla(doc, 'OTROS DETALLES', legales.x, yOtros);
    doc.text(ctx.otrosDetalles ?? '', legales.x, yOtros + 12, { width: legales.width, lineGap: 2 });

    const mailPie = ctx.contacto?.email ?? mail;
    const telPie = ctx.contacto?.telefono ?? tel;
    textoDerecha(doc, mailPie, pie.contactoX, pie.contactoY, { width: 220 });
    textoDerecha(doc, telPie, pie.contactoX, pie.contactoY + 14, { width: 220 });
    const terceraLineaPie =
      handleDesdeSitioWeb(ctx.sitioWeb) ??
      (ctx.contacto?.whatsapp ? String(ctx.contacto.whatsapp).replace(/^https?:\/\/(wa\.me\/)?/, '') : null);
    if (terceraLineaPie) {
      textoDerecha(doc, terceraLineaPie, pie.contactoX, pie.contactoY + 28, { width: 220 });
    }

    doc.rect(0, pie.webBarY, layout.page.width * 0.55, pie.webBarHeight).fill(C.pieAmarillo);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.texto);
    doc.text(ctx.sitioWeb ?? '', 48, pie.webBarY + 8);

    doc.rect(0, pie.grisBarY, layout.page.width, pie.grisBarHeight).fill(C.pieGris);

    doc.end();
  });
}
