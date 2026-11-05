function mapaPorClave(textos) {
  return textos.reduce((acc, item) => {
    acc[item.clave] = item.valor;
    return acc;
  }, {});
}

function parrafosHistoriDesdeMapa(mapa) {
  return Object.keys(mapa)
    .filter((clave) => clave.startsWith('historia.parrafo.'))
    .sort((a, b) => {
      const numA = Number(a.split('.').pop());
      const numB = Number(b.split('.').pop());
      return numA - numB;
    })
    .map((clave) => mapa[clave]);
}

function valoresNumerados(mapa, prefijo) {
  const re = new RegExp(`^${prefijo.replace(/\./g, '\\.')}\\.(\\d+)$`);
  const indices = new Set();
  Object.keys(mapa).forEach((clave) => {
    const match = clave.match(re);
    if (match) indices.add(Number(match[1]));
  });

  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => mapa[`${prefijo}.${index}`] ?? '')
    .filter((valor) => String(valor).trim());
}

function statsHistoriDesdeMapa(mapa) {
  const indices = new Set();
  Object.keys(mapa).forEach((clave) => {
    const match = clave.match(/^historia\.stat\.(\d+)\.(valor|etiqueta)$/);
    if (match) indices.add(Number(match[1]));
  });

  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => ({
      valor: mapa[`historia.stat.${index}.valor`] ?? '',
      etiqueta: mapa[`historia.stat.${index}.etiqueta`] ?? '',
    }))
    .filter((stat) => stat.valor || stat.etiqueta);
}

export function mapearContenidoPublico(textos) {
  const mapa = mapaPorClave(textos);

  return {
    nombreEmpresa: mapa['empresa.nombre'] ?? '',
    tagline: mapa['empresa.tagline'] ?? '',
    descripcion: mapa['empresa.descripcion'] ?? '',
    hero: {
      titulo: mapa['hero.titulo'] ?? '',
      subtitulo: mapa['hero.subtitulo'] ?? '',
      ctaProductos: mapa['hero.ctaProductos'] ?? '',
      ctaProductosHref: mapa['hero.ctaProductosHref'] ?? '',
      ctaContacto: mapa['hero.ctaContacto'] ?? '',
      ctaSecundario: mapa['hero.ctaSecundario'] ?? '',
      ctaSecundarioHref: mapa['hero.ctaSecundarioHref'] ?? '',
      scrollTexto: mapa['hero.scrollTexto'] ?? '',
      scrollHref: mapa['hero.scrollHref'] ?? '',
      frases: valoresNumerados(mapa, 'hero.frase'),
      highlights: valoresNumerados(mapa, 'hero.highlight'),
    },
    historia: {
      titulo: mapa['historia.titulo'] ?? '',
      subtitulo: mapa['historia.subtitulo'] ?? '',
      parrafos: parrafosHistoriDesdeMapa(mapa),
      stats: statsHistoriDesdeMapa(mapa),
    },
    productos: {
      titulo: mapa['productos.titulo'] ?? '',
      subtitulo: mapa['productos.subtitulo'] ?? '',
      vacio: mapa['productos.vacio'] ?? '',
    },
    contactoSection: {
      titulo: mapa['contacto.titulo'] ?? '',
      subtitulo: mapa['contacto.subtitulo'] ?? '',
    },
    nav: {
      inicio: mapa['nav.inicio'] ?? '',
      historia: mapa['nav.historia'] ?? '',
      productos: mapa['nav.productos'] ?? '',
      contacto: mapa['nav.contacto'] ?? '',
    },
    loUltimo: {
      titulo: mapa['loUltimo.titulo'] ?? '',
      subtitulo: mapa['loUltimo.subtitulo'] ?? '',
    },
    footer: {
      seccionesTitulo: mapa['footer.seccionesTitulo'] ?? '',
      contactoTitulo: mapa['footer.contactoTitulo'] ?? '',
      seguinosTitulo: mapa['footer.seguinosTitulo'] ?? '',
      escribinosTitulo: mapa['footer.escribinosTitulo'] ?? '',
      ctaTexto: mapa['footer.ctaTexto'] ?? '',
      whatsapp: mapa['footer.whatsapp'] ?? '',
      ubicacion: mapa['footer.ubicacion'] ?? '',
      copyright: mapa['footer.copyright'] ?? '',
    },
  };
}

export function mapearBrandingPublico(branding, contenido) {
  return {
    ...contenido,
    branding: branding
      ? {
          colorPrimario: branding.colorPrimario,
          colorPrimarioOscuro: branding.colorPrimarioOscuro,
          colorSecundario: branding.colorSecundario,
          colorAcento: branding.colorAcento,
          colorFondo: branding.colorFondo,
          colorFondoOscuro: branding.colorFondoOscuro,
          colorTexto: branding.colorTexto,
          colorTextoClaro: branding.colorTextoClaro,
          colorError: branding.colorError,
          colorExito: branding.colorExito,
          logoUrl: branding.logoUrl,
          logoAlt: branding.logoAlt,
        }
      : null,
  };
}
