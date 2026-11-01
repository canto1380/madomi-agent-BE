/**
 * Evaluación agente-clientes-ia — dataset JSON + aserciones.
 *
 * Uso:
 *   npm run test:eval:chat -- --tag smoke
 *   npm run test:eval:chat -- --id saludo-puro
 *   node scripts/eval-chat/run-eval-chat.js --tag llm --json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { bootstrapEvalChat, teardownEvalChat } from './setupEvalEnv.js';
import { evaluarExpectativas } from './evaluarExpectativas.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { tags: [], ids: [], json: false, dataset: path.join(here, 'dataset.json') };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') {
      out.json = true;
    } else if (a === '--tag' && argv[i + 1]) {
      out.tags.push(argv[++i]);
    } else if (a === '--id' && argv[i + 1]) {
      out.ids.push(argv[++i]);
    } else if (a === '--dataset' && argv[i + 1]) {
      out.dataset = path.resolve(argv[++i]);
    }
  }
  return out;
}

function filtrarEscenarios(escenarios, { tags, ids }) {
  let lista = escenarios;
  if (ids.length) {
    lista = lista.filter((s) => ids.includes(s.id));
  }
  if (tags.length) {
    lista = lista.filter((s) => s.tags?.some((t) => tags.includes(t)));
  }
  return lista;
}

async function ejecutarEscenario(enviarMensajeChatServicio, escenario) {
  const sessionAnonimaId = randomUUID();
  const turnosResult = [];
  let ultimo = null;

  const errores = [];

  for (let i = 0; i < escenario.turnos.length; i += 1) {
    const mensaje = escenario.turnos[i];
    const inicio = Date.now();
    ultimo = await enviarMensajeChatServicio({
      sessionAnonimaId,
      mensaje,
      metadata: { canal: 'eval-chat', escenarioId: escenario.id },
    });
    const latenciaMs = Date.now() - inicio;
    turnosResult.push({
      indice: i + 1,
      mensaje,
      latenciaMs,
      presupuestoId: ultimo.presupuestoId,
      respuestaPreview: ultimo.respuesta?.slice(0, 120),
    });

    const expectTurno = escenario.expectPorTurno?.[i];
    if (expectTurno) {
      const errTurno = evaluarExpectativas(expectTurno, {
        respuesta: ultimo?.respuesta ?? '',
        presupuestoId: ultimo?.presupuestoId ?? null,
        latenciaMs,
        estadoLead: ultimo?.estadoLead ?? null,
      });
      for (const e of errTurno) {
        errores.push(`turno ${i + 1}: ${e}`);
      }
    }
  }

  if (escenario.expect) {
    const ultimoTurno = turnosResult[turnosResult.length - 1];
    const errFinal = evaluarExpectativas(escenario.expect, {
      respuesta: ultimo?.respuesta ?? '',
      presupuestoId: ultimo?.presupuestoId ?? null,
      latenciaMs: ultimoTurno?.latenciaMs ?? 0,
      estadoLead: ultimo?.estadoLead ?? null,
    });
    for (const e of errFinal) {
      errores.push(`último turno: ${e}`);
    }
  }

  const erroresUnicos = [...new Set(errores)];

  return {
    id: escenario.id,
    ok: erroresUnicos.length === 0,
    errores: erroresUnicos,
    turnos: turnosResult,
    respuestaFinal: ultimo?.respuesta ?? '',
    presupuestoId: ultimo?.presupuestoId ?? null,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const raw = fs.readFileSync(args.dataset, 'utf8');
  const dataset = JSON.parse(raw);
  const escenarios = filtrarEscenarios(dataset.escenarios ?? [], args);

  if (!escenarios.length) {
    console.error('Ningún escenario coincide con --tag / --id');
    process.exit(1);
  }

  const { env, enviarMensajeChatServicio } = await bootstrapEvalChat();

  console.log('=== Eval chat agente-clientes-ia ===');
  console.log(`Runtime: ${env.ASISTENTE_RUNTIME} | LLM: ${env.ASISTENTE_LLM_PROVEEDOR}`);
  console.log(`Escenarios: ${escenarios.length}\n`);

  const resultados = [];
  for (const esc of escenarios) {
    process.stdout.write(`• ${esc.id} … `);
    try {
      const r = await ejecutarEscenario(enviarMensajeChatServicio, esc);
      resultados.push(r);
      console.log(r.ok ? 'OK' : 'FAIL');
      if (!r.ok && !args.json) {
        for (const e of r.errores) {
          console.log(`    ✗ ${e}`);
        }
        console.log(`    respuesta: ${r.respuestaFinal.slice(0, 200)}…`);
      }
    } catch (err) {
      const r = {
        id: esc.id,
        ok: false,
        errores: [err.message ?? String(err)],
        turnos: [],
        respuestaFinal: '',
        presupuestoId: null,
      };
      resultados.push(r);
      console.log('ERROR');
      if (!args.json) {
        console.log(`    ✗ ${r.errores[0]}`);
      }
    }
  }

  await teardownEvalChat();

  const ok = resultados.filter((r) => r.ok).length;
  const fail = resultados.length - ok;

  if (args.json) {
    console.log(JSON.stringify({ ok, fail, total: resultados.length, resultados }, null, 2));
  } else {
    console.log(`\nResumen: ${ok} OK, ${fail} FAIL (${resultados.length} total)`);
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
