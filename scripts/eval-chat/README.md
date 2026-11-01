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
- Escenarios **`smoke`** (p. ej. `saludo-puro`) no dependen de Cursor en el primer turno (fast path)

## Cómo correr

Desde `backend/`:

```bash
# Rápido (~segundos): solo tag smoke
npm run test:eval:chat:smoke

# Todos los escenarios del dataset (varios minutos, usa Cursor)
npm run test:eval:chat

# Un escenario
node scripts/eval-chat/run-eval-chat.js --id saludo-puro

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

- `respuestaContiene`: array de fragmentos (todas deben aparecer)
- `respuestaContieneAny`: al menos uno
- `respuestaNoContiene`
- `respuestaRegex`
- `presupuestoId`: `"present"` \| `"absent"`
- `maxLatenciaMs`
- `estadoLead` (opcional)

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
