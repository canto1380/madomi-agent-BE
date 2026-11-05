# Evaluación del chat — agente-clientes-ia (fase 3)

## Qué es

Un **dataset de escenarios** (mensajes en secuencia, como un usuario real) y un **runner** que:

1. Arranca el mismo stack que producción (`enviarMensajeChatServicio` → runtime `agente-clientes-ia`).
2. Ejecuta cada escenario con una **sesión nueva** (`sessionAnonimaId` UUID).
3. Comprueba **expectativas** sobre el último turno (texto, `presupuestoId`, latencia máxima).

No reemplaza pruebas manuales en el widget, pero detecta regresiones de saludo, novedades, precios y flujo presupuesto.

## Requisitos

- `FEATURE_ASISTENTE=true`
- Postgres + Mongo levantados, seeds aplicados (`npm run db:seed`, `npm run db:seed:mongo`)
- Bot activo en Mongo
- **`CURSOR_API_KEY`** (cloud) para escenarios con tag `llm` / `slow`
- Opción A: **todos** los turnos usan Cursor (incl. `smoke`); reservá tiempo y API quota

## Cómo correr

Desde `backend/`:

```bash
# Rápido (~segundos): solo tag smoke
npm run test:eval:chat:smoke

# Todos los escenarios del dataset (varios minutos, usa Cursor)
npm run test:eval:chat

# Un escenario (npm requiere `--` antes de `--id`)
npm run test:eval:chat -- --id hilo-humita-correccion
# o posicional:
node scripts/eval-chat/run-eval-chat.js hilo-humita-correccion

# Solo escenarios LLM (catálogo, precio, presupuesto)
node scripts/eval-chat/run-eval-chat.js --tag llm

# Salida JSON (CI / logs)
node scripts/eval-chat/run-eval-chat.js --tag smoke --json
```

Variables útiles (`.env` o inline):

| Variable | Efecto |
|----------|--------|
| `ASISTENTE_RUNTIME=agente-clientes-ia` | Default del runner |
| `ASISTENTE_LLM_PROVEEDOR=auto` | Cursor si hay key |
| `CHAT_TURN_TIMEOUT_MS` | Timeout por turno en backend |
| `EVAL_CHAT_TURN_TIMEOUT_MS` | Default 180000 en eval si no hay CHAT_TURN_TIMEOUT_MS |
| `EVAL_CHAT_ESCENARIO_DELAY_MS` | Pausa entre escenarios (default 8000) |
| `EVAL_CHAT_TURNO_DELAY_MS` | Pausa entre turnos multi-mensaje (default 2500) |

## Si casi todo falla con “problema momentáneo”

1. **¿Corriste un solo escenario?** Con npm hace falta `--` antes de `--id`. Sin filtro se ejecutan los 7 escenarios seguidos.
2. **Límite Cursor Cloud Agents:** si en consola aparece `reached the limit` / `Cloud Agents simultaneously`, no es el bot: es la cuota concurrente del plan. Esperá unos minutos, corré `--id` de a uno, o subí el plan / bajá agentes cloud activos en Cursor.
3. **Timeouts:** en eval el turno mínimo pasa a 180s; podés subir con `EVAL_CHAT_TURN_TIMEOUT_MS`.

## Dataset

Archivo: [`dataset.json`](./dataset.json)

Cada escenario:

| Campo | Significado |
|-------|-------------|
| `id` | Identificador estable |
| `tags` | `smoke`, `llm`, `presupuesto`, `slow`, … |
| `turnos` | Mensajes user en orden |
| `expect` | Aserciones sobre el **último** turno |
| `expectPorTurno` | Array alineado con `turnos`: aserciones **por paso** (ideal presupuesto) |

Expectativas soportadas (`evaluarExpectativas.js`):

**Texto**

- `respuestaContiene` / `respuestaContieneAny` / `respuestaNoContiene` / `respuestaRegex`
- `minRespuestaLength` / `maxRespuestaLength`

**Comportamiento (sin atar a un producto del catálogo)**

- `montoArsEnRespuesta`: hay `$` o montos parseables / ARS
- `mencionaPrecioOStock`: precio, stock, disponibilidad o monto
- `pideLocalidadOEnvio`: localidad, barrio, envío, zona
- `respuestaCatalogoONovedades`: respuesta coherente con catálogo/novedades
- `reconoceCorreccionOMeta`: disculpa / reconoce error previo (turnos meta)
- `noFallbackError`: no “problema momentáneo”, timeout copy, etc.
- `noPlantillaSinCoincidencias`: no plantilla rígida “no encontré productos…”

**Runtime**

- `minToolCalls` / `maxToolCalls` (desde `toolCallsCount` del servicio chat)
- `presupuestoId`: `"present"` \| `"absent"`
- `maxLatenciaMs`, `estadoLead` (opcional)

Los **mensajes** del dataset pueden nombrar productos reales (como un cliente); las **aserciones** priorizan formato y flujo, no SKUs.

Verificación rápida del evaluador: `npm run test:eval:expectativas`.

Para añadir un caso: copiá un bloque en `dataset.json`, ajustá turnos y `expect`, corré `--id tu-id`.

## Interpretación

- **FAIL** = regresión (copy, presupuesto, timeout). Revisá prompt runtime o commerce kernel, no el orquestador legacy.
- **ERROR** = infra (Mongo, bot off, 503, Cursor caído).
- Latencias altas en `llm` son normales; subí `maxLatenciaMs` solo si el negocio lo acepta.

## ¿Cómo se relaciona con el chat de la landing?

| | Eval (`npm run test:eval:chat`) | Widget en el navegador |
|--|--------------------------------|-------------------------|
| **Qué prueba** | Backend: `enviarMensajeChatServicio` | UI + `POST /api/chat` (SSE) |
| **Config** | Lee `backend/.env` | Backend `.env` + `frontend/.env` + bot activo en admin |
| **Sesión** | UUID nuevo por escenario | `sessionAnonimaId` en localStorage del navegador |
| **Cuándo usar** | Regresiones, CI, después de cambiar prompt/kernel | UX real, tiempos percibidos, mobile |

No hay un “modo eval” en el widget. Si el eval pasa y el widget falla, revisá CORS (`CORS_ORIGIN`), `VITE_API_URL`, bot inactivo o timeout del navegador (`VITE_CHAT_STREAM_TIMEOUT_MS`).

**Checklist widget igual que eval:**

1. `FEATURE_ASISTENTE=true`, Mongo conectado, seed mongo hecho.
2. `ASISTENTE_RUNTIME=agente-clientes-ia` y `CURSOR_API_KEY` (cloud).
3. Bot `activo: true` en admin.
4. `GET http://localhost:4000/api/chat/estado` → `"disponible": true`.

**Probar el flujo presupuesto a mano** (equivalente a `presupuesto-flujo-completo`):

1. `10 unidades de bondiola y 15 de guiso de lenteja`
2. `Alejandro penalba 3815479768`
3. `Soy de San Miguel de Tucuman`

Esperado: pasos 1–2 sin PDF; paso 3 con link PDF y `presupuestoId` en la respuesta API.

```powershell
npm run test:eval:chat -- --id presupuesto-flujo-completo
```

## Relación con otros scripts

| Script | Uso |
|--------|-----|
| `test-chat-cursor-smoke.js` | Un hola manual |
| `test-chat-presupuesto-flow.js` | Flujo presupuesto sin asserts |
| `test:e2e:chat-productos` | Legacy orquestador + casos viejos |

Preferí ampliar **`eval-chat/dataset.json`** para nuevos criterios de aceptación.
