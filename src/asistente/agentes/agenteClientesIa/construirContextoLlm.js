import { buildSystemPromptV1 } from '../../prompts/systemV1.js';
import { loadMadomiPromptRedaccion } from '../../prompts/loadMadomiPrompt.js';
import { loadReglasRuntimeAgenteClientesIa } from './reglasRuntimePrompt.js';

function resumirEstadoSesion(estado, leadDatos) {
  const payload = {
    zonaEnvio: estado.zonaEnvio ?? leadDatos?.localidad ?? null,
    esperandoAccion: estado.esperandoAccion ?? null,
    presupuestoIdActivo: estado.presupuestoIdActivo ?? null,
    productosEnContexto: (estado.productosEnContexto ?? []).slice(-8),
    ultimosProductosMostrados: (estado.ultimosProductosMostrados ?? []).slice(-6),
    carritoSesion: (estado.carritoSesion ?? []).slice(-8),
    pedidoBorrador: estado.pedidoBorrador ?? { items: [], itemsPendientes: [] },
  };
  return JSON.stringify(payload, null, 2);
}

function resumirLead(leadDatos) {
  if (!leadDatos || typeof leadDatos !== 'object') {
    return '{}';
  }
  const { nombre, apellido, telefono, localidad, provincia } = leadDatos;
  return JSON.stringify(
    {
      nombre: nombre ?? null,
      apellido: apellido ?? null,
      telefono: telefono ?? null,
      localidad: localidad ?? null,
      provincia: provincia ?? null,
    },
    null,
    2,
  );
}

/**
 * @param {{ compacto?: boolean }} opts — Cursor cloud: prompt corto (evita timeout en saludos/consultas).
 */
export function construirSystemPromptAgenteClientesIa({
  empresa,
  bot,
  estado,
  leadDatos,
  compacto = false,
}) {
  const maestro = compacto
    ? loadMadomiPromptRedaccion({ empresa, bot })
    : buildSystemPromptV1({ empresa, bot, incluirPromptMaestro: true });
  const reglasRuntime = loadReglasRuntimeAgenteClientesIa();
  const estadoJson = resumirEstadoSesion(estado, leadDatos);
  const leadJson = resumirLead(leadDatos);

  return `${maestro}

---

${reglasRuntime}

---

## Estado de sesión (persistido — usalo para continuidad)

\`\`\`json
${estadoJson}
\`\`\`

## Datos del lead conocidos

\`\`\`json
${leadJson}
\`\`\`
`;
}
