import { normalizarTelefono } from '../../utils/telefono.js';

const LOCALIDAD_HINT =
  /san miguel|tucum[aá]n|yerba buena|capital|lules|ald|banda|concepci[oó]n|monteros|famaill[aá]/i;

function extraerTelefonoTexto(mensaje) {
  const candidatos = [
    ...mensaje.matchAll(/\b(3[0-9]{9})\b/g),
    ...mensaje.matchAll(/\b0?381[0-9]{7}\b/g),
    ...mensaje.matchAll(/\b0381\s*[0-9]{3}\s*[0-9]{4}\b/g),
  ].map((m) => m[0]);

  for (const raw of candidatos) {
    const norm = normalizarTelefono(raw);
    if (norm) {
      return { telefono: raw.replace(/\s/g, ''), telefonoNormalizado: norm };
    }
  }
  return null;
}

function parsearNombreLinea(linea) {
  const limpia = linea.replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (limpia.length < 2 || /\d/.test(limpia)) {
    return null;
  }
  const partes = limpia.split(' ').filter(Boolean);
  if (partes.length === 0) {
    return null;
  }
  return {
    nombre: partes[0],
    apellido: partes.length > 1 ? partes.slice(1).join(' ') : undefined,
  };
}

/** "mi nombre es Jorge Molina", "me llamo Ana", etc. */
function extraerNombreExplicito(texto) {
  const m =
    texto.match(
      /(?:me\s+llamo|mi\s+nombre\s+es|me\s+dicen)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ]+(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]+){0,4})/i,
    ) ??
    texto.match(/^soy\s+(?!de\b)([a-záéíóúñA-ZÁÉÍÓÚÑ]+(?:\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]+){0,4})\s*\.?$/i);
  if (!m?.[1]) {
    return null;
  }
  const limpio = m[1].replace(/\s+/g, ' ').trim();
  const partes = limpio.split(' ').filter(Boolean);
  if (partes.length === 0 || partes[0].length < 2) {
    return null;
  }
  const stop = new Set(['hola', 'buenas', 'cliente', 'madomi']);
  if (stop.has(partes[0].toLowerCase())) {
    return null;
  }
  return {
    nombre: partes[0],
    apellido: partes.length > 1 ? partes.slice(1).join(' ') : undefined,
    explicito: true,
  };
}

export function extraerLocalidadDeclarada(texto) {
  const m = texto.match(
    /(?:vivo en|soy de|estoy en|radico en|me encuentro en)\s+([a-záéíóúñ0-9\s,.-]{3,80})/i,
  );
  if (!m?.[1]) {
    return null;
  }
  return m[1].replace(/\.$/, '').replace(/\s+/g, ' ').trim();
}

export function mensajeIndicaDatosPersonales(mensaje) {
  return (
    /(?:me\s+llamo|mi\s+nombre\s+es|me\s+dicen|soy\s+(?!de\b)[a-záéíóúñ]{2,})/i.test(mensaje) ||
    /(?:tel[eé]fono|whatsapp|celular|mi\s+n[uú]mero)/i.test(mensaje) ||
    /(?:vivo en|soy de|estoy en|localidad|barrio)\s+/i.test(mensaje)
  );
}

/**
 * Detecta nombre, teléfono y localidad en mensajes libres (una o varias líneas).
 */
export function extraerDatosContacto(mensaje) {
  const texto = mensaje.trim();
  if (!texto) {
    return { tieneDatos: false, esSoloContacto: false, args: {} };
  }

  const tel = extraerTelefonoTexto(texto);
  const compactoNombreTel = texto.match(
    /^([A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)?)\s*[.,]?\s*(?:celular|tel[eé]fono|cel|whatsapp|wtsp)\s*[:\s]*([0-9\s-]{8,})/i,
  );
  const nombreApellidoTel = texto.match(
    /^([A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+){0,4})\s+(3[0-9]{9})\s*\.?$/,
  );

  const lineas = texto.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  let nombre;
  let apellido;
  let localidad;
  let nombreExplicito = false;

  const explicito = extraerNombreExplicito(texto);
  if (explicito) {
    nombre = explicito.nombre;
    apellido = explicito.apellido;
    nombreExplicito = true;
  }

  if (compactoNombreTel) {
    const partesNom = compactoNombreTel[1].trim().split(/\s+/).filter(Boolean);
    if (partesNom.length) {
      nombre = partesNom[0];
      apellido = partesNom.length > 1 ? partesNom.slice(1).join(' ') : apellido;
      nombreExplicito = true;
    }
  }

  if (nombreApellidoTel && !nombre) {
    const partesNom = nombreApellidoTel[1].trim().split(/\s+/).filter(Boolean);
    if (partesNom.length) {
      nombre = partesNom[0];
      apellido = partesNom.length > 1 ? partesNom.slice(1).join(' ') : undefined;
    }
  }

  for (const linea of lineas) {
    if (tel && linea.replace(/\D/g, '').includes(tel.telefonoNormalizado.slice(-8))) {
      continue;
    }
    const locLinea = extraerLocalidadDeclarada(linea);
    if (locLinea) {
      localidad = locLinea;
      continue;
    }
    if (LOCALIDAD_HINT.test(linea) && linea.length < 80 && !/^soy\b/i.test(linea)) {
      localidad = linea.replace(/\.$/, '').trim();
      continue;
    }
    if (nombreExplicito) {
      continue;
    }
    const nom = parsearNombreLinea(linea);
    if (nom && !nombre && !/^(mi|me|soy|nombre)$/i.test(nom.nombre)) {
      nombre = nom.nombre;
      apellido = nom.apellido;
    }
  }

  if (!localidad) {
    localidad = extraerLocalidadDeclarada(texto);
  }
  if (!localidad) {
    const inlineLoc = texto.match(/(?:localidad|zona)\s+([a-záéíóúñ0-9\s,.-]{3,60})/i);
    if (inlineLoc) {
      localidad = inlineLoc[1].replace(/\.$/, '').trim();
    }
  }

  const args = {};
  if (nombre) {
    args.nombre = nombre;
  }
  if (apellido) {
    args.apellido = apellido;
  }
  let telefonoFinal = tel?.telefono ?? null;
  if (!telefonoFinal && compactoNombreTel?.[2]) {
    telefonoFinal = compactoNombreTel[2].replace(/\s/g, '');
  }
  if (telefonoFinal) {
    args.telefono = telefonoFinal;
  }
  if (localidad) {
    args.localidad = localidad;
    args.provincia = 'Tucumán';
  }

  const soloLocalidad =
    Boolean(localidad) &&
    /(?:vivo en|soy de|estoy en|radico en|me encuentro en)/i.test(texto) &&
    !/(precio|producto|stock|cu[aá]nto)/i.test(texto);

  const tieneDatos = Boolean(
    telefonoFinal ||
      (nombre && localidad) ||
      (nombre && telefonoFinal) ||
      (nombre && nombreExplicito) ||
      soloLocalidad,
  );
  const esSoloContacto =
    tieneDatos &&
    !/(precio|precios|producto|stock|cu[aá]nto|sale|cuesta|cotiz|presupuesto|ravioles|bondiola|guiso|fideos)/i.test(
      texto,
    );

  return { tieneDatos, esSoloContacto, args, nombreExplicito };
}

export function mensajePareceDatosContacto(mensaje) {
  if (mensajeIndicaDatosPersonales(mensaje)) {
    return true;
  }
  const { tieneDatos, esSoloContacto } = extraerDatosContacto(mensaje);
  if (esSoloContacto) {
    return true;
  }
  const tel = extraerTelefonoTexto(mensaje);
  return Boolean(tel && extraerDatosContacto(mensaje).args.nombre);
}
