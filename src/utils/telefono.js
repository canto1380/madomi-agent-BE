/**
 * Normaliza teléfono AR a E.164 sin espacios (v1 simplificado).
 */
export function normalizarTelefono(telefono) {
  if (!telefono || typeof telefono !== 'string') {
    return null;
  }
  let digits = telefono.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  if (digits.startsWith('54')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length >= 10) {
    return `+54${digits}`;
  }
  return `+54${digits}`;
}
