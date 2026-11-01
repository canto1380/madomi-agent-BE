# Spec v1 — Asistente comercial + CRM (Postgres + Mongo)

> **Estado:** diseño aprobado — pendiente implementación por fases.  
> **Agentes Cursor:** `@madomi-backend` (datos comerciales Postgres + montaje), `@madomi-asistente` (chat/runtime), `@madomi-crm` (panel admin CRM), `@madomi-frontend` (widget landing).  
> **Políticas de ejemplo:** [`politicas-entrega-ejemplo.md`](./politicas-entrega-ejemplo.md)

---

## 1. Principios

| Tema | Decisión
|------|----------|
| Fuente de verdad precios/stock/ofertas | **PostgreSQL** (`Productos` + admin) |
| Fuente de verdad políticas/FAQ narrativas | **Markdown versionado** → Mongo `EmpresaContexto` (+ RAG opcional) |
| Conversaciones, leads, presupuestos, pedidos | **MongoDB** |
| Enlace cross-DB | `productoId` = `Productos.id`; cliente por `telefonoNormalizado`; admin por `usuarioId` (Postgres JWT) |
| API respuesta | `{ data, error, message }` (convención existente) |
| Landing pública | **Sin** precios en `GET /api/productos` |

---

## 2. Gates — cuándo crear cada skill / agente

| Fase | Trabajo | Agente Cursor |
|------|---------|---------------|
| **0** | Esta spec + variables `.env` documentadas | `@madomi-backend` |
| **1** | Migración Prisma campos comerciales + CRUD admin precios/stock en productos | `@madomi-backend` |
| **2** | Conexión Mongo, modelos Mongoose, repos, seed `EmpresaContexto` desde MD de políticas | `@madomi-backend` (infra) → **crear `@madomi-asistente`** al empezar chat |
| **3** | `POST /api/chat`, loop LLM, tools, persistencia Lead/Conversacion | **`@madomi-asistente`** (+ backend compartido) |
| **4** | Presupuesto PDF, `cerrarVenta`, estados pipeline | `@madomi-asistente` |
| **5** | `GET/PUT /api/admin/crm/*`, stats, filtros | `@madomi-backend` APIs + **crear `@madomi-crm`** para UI |
| **6** | Widget chat en landing (SSE), session cookie/localStorage | **Extender `@madomi-frontend`** (+ skill widget si crece) |
| **7** | Import PDF catálogo → Postgres (preview diff) | `@madomi-backend` |

**Aviso explícito:** crear carpetas `.cursor/skills/madomi-asistente/` y `madomi-crm/` **al iniciar la fase 2 y 5 respectivamente**, no antes (evita skills vacíos). El widget frontend **solo en fase 6**; hasta entonces probar chat con curl/Postman o página dev aislada.

---

## 3. PostgreSQL — Prisma

### 3.1 Extensión `Productos`

Agregar al model `Productos` en `backend/prisma/schema.prisma`:

```prisma
model Productos {
  id          String   @id
  nombre      String
  categoria   String
  descripcion String?
  imagenUrl   String?
  activo      Boolean  @default(true)
  orden       Int      @default(0)

  /// Comercial (no expuesto en API pública landing)
  precioMinorista   Decimal?  @db.Decimal(12, 2)
  precioMayorista   Decimal?  @db.Decimal(12, 2)
  stockUnidades     Int       @default(0)
  unidadStock       String    @default("un") // un | kg | caja
  ofertaPorcentaje  Int?      // 0-100
  ofertaDesde       DateTime?
  ofertaHasta       DateTime?
  activoComercial   Boolean   @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  destacados ProductosDestacados[]

  @@index([activo])
  @@index([categoria])
  @@index([activoComercial])
}
```

**Reglas:**

- Montos en **pesos ARS** con 2 decimales (no centavos en v1).
- `DELETE` admin productos sigue siendo baja lógica (`activo: false`); campos comerciales se conservan.
- Seed existente: campos comerciales `null` / `0` hasta carga admin o import.

### 3.2 DTO admin producto (ampliación)

Admin `GET/PUT /api/admin/productos` incluye:

```ts
{
  precioMinorista?: number | null;
  precioMayorista?: number | null;
  stockUnidades: number;
  unidadStock: string;
  ofertaPorcentaje?: number | null;
  ofertaDesde?: string | null; // ISO
  ofertaHasta?: string | null;
  activoComercial: boolean;
}
```

Validación Zod: `ofertaPorcentaje` 0–100; si hay oferta, recomendar fechas; `stockUnidades >= 0`.

### 3.3 Zonas de envío (fase 1.5 opcional — Postgres)

Si se parametriza costo/plazo sin depender solo del MD:

```prisma
model ZonasEnvio {
  id              String   @id @default(cuid())
  codigo          String   @unique // zona_a, zona_b, ...
  nombre          String
  localidades     String[] // lista o JSON en v1
  costoEnvioMinorista Decimal @db.Decimal(12, 2)
  pedidoMinimo    Decimal? @db.Decimal(12, 2)
  envioGratisDesde Decimal? @db.Decimal(12, 2)
  diasReparto     String[] // lun, mar, ...
  plazoHabilMin   Int
  plazoHabilMax   Int
  activo          Boolean  @default(true)
  orden           Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([activo])
}
```

Tool del agente: `consultarEnvio(localidad, departamento)` consulta esta tabla + fallback RAG en `EmpresaContexto`.

---

## 4. MongoDB — colecciones e índices

**Database sugerida:** `madomi_crm`  
**Variable:** `MONGODB_URI` (ver §8)

Convención: `_id` ObjectId; referencias externas Postgres como `String` (`productoId`, `usuarioId`).

### 4.1 `empresas`

```js
{
  _id, slug: "madomi", nombre: "Madomi Pastas",
  timezone: "America/Argentina/Tucuman",
  moneda: "ARS",
  vigenciaPresupuestoHoras: 72,
  createdAt, updatedAt
}
```

Índices: `{ slug: 1 }` unique.

### 4.2 `empresa_contextos`

Versiones de MD (políticas, FAQ, tono).

```js
{
  _id, empresaId, tipo: "politicas_entrega" | "faq_comercial" | "tono_marca",
  version: "2026-09-23",
  markdown: "...",
  hash: "sha256...",
  origenPdfUrl: null | string,
  vigenteDesde: Date,
  vigenteHasta: null | Date,
  chunks: [{ chunkId, titulo, texto, embedding?: number[] }],
  createdAt
}
```

Índices:

- `{ empresaId: 1, tipo: 1, vigenteDesde: -1 }`
- `{ empresaId: 1, tipo: 1, vigenteHasta: 1 }` — query “vigente ahora”
- Vector (fase RAG): `{ "chunks.embedding": "vectorSearch" }` si Atlas Vector Search

### 4.3 `clientes`

```js
{
  _id, empresaId,
  nombre, apellido, email, telefono, telefonoNormalizado, // E.164 sin espacios
  direccion, localidad, departamento, provincia: "Tucumán",
  esMayorista: false, cuit: null,
  preferencias: { sinPromociones: false },
  postgresUsuarioId: null, // futuro
  createdAt, updatedAt
}
```

Índices:

- `{ empresaId: 1, telefonoNormalizado: 1 }` unique sparse
- `{ empresaId: 1, email: 1 }` sparse
- `{ empresaId: 1, localidad: 1, departamento: 1 }`
- Text: `{ nombre: "text", apellido: "text", telefono: "text" }` (opcional)

### 4.4 `leads`

```js
{
  _id, empresaId, clienteId, conversacionIdActiva,
  estado: "nuevo" | "consultando" | "presupuesto_abierto" | "presupuesto_enviado"
        | "pedido_cerrado" | "abandonado" | "pendiente_validacion_logistica",
  datosCapturados: { /* merge parcial */ },
  productosInteres: [{ productoId, nombreSnapshot, categoriaSnapshot }],
  localidad, departamento,
  cuelloBotella: null | "precio" | "envio" | "stock" | "solo_consulta" | "otro",
  motivoAbandono: null | string,
  asignadoAUsuarioId: null | string, // Postgres Usuarios.id
  ultimoMensajeAt: Date,
  createdAt, updatedAt
}
```

Índices:

- `{ empresaId: 1, estado: 1, updatedAt: -1 }`
- `{ empresaId: 1, ultimoMensajeAt: -1 }`
- `{ empresaId: 1, clienteId: 1 }`
- `{ empresaId: 1, "productosInteres.productoId": 1 }`
- `{ asignadoAUsuarioId: 1, estado: 1 }`

### 4.5 `conversaciones`

```js
{
  _id, empresaId, leadId, clienteId,
  canal: "web_chat",
  sessionAnonimaId: string, // UUID cookie antes de identificar
  mensajes: [{
    rol: "user" | "assistant" | "system" | "tool",
    contenido: string,
    toolCalls: [{ id, name, argumentsJson }],
    toolResult: null | object,
    createdAt: Date
  }],
  escaladoHumano: false,
  metadata: { userAgent, ipHash },
  createdAt, updatedAt
}
```

**Nota:** si `mensajes` supera ~500 KB, migrar a colección `mensajes_chat` con `{ conversacionId, orden }`.

Índices:

- `{ empresaId: 1, sessionAnonimaId: 1 }`
- `{ empresaId: 1, leadId: 1 }`
- `{ empresaId: 1, clienteId: 1, updatedAt: -1 }`
- `{ empresaId: 1, updatedAt: -1 }`

### 4.6 `presupuestos`

```js
{
  _id, empresaId, leadId, clienteId, conversacionId,
  items: [{
    productoId, nombreSnapshot, cantidad, unidad,
    precioUnitarioSnapshot, descuentoPorcentaje, subtotalLinea
  }],
  subtotal, descuentoTotal, costoEnvio, total,
  moneda: "ARS",
  estado: "borrador" | "enviado" | "aceptado" | "vencido" | "rechazado",
  pdfUrl: null | string,
  validezHasta: Date,
  generadoPor: "agente" | "admin",
  createdAt, updatedAt
}
```

Índices:

- `{ empresaId: 1, estado: 1, createdAt: -1 }`
- `{ empresaId: 1, clienteId: 1, createdAt: -1 }`
- `{ leadId: 1 }`
- `{ validezHasta: 1, estado: 1 }`

### 4.7 `pedidos`

Venta cerrada (snapshot legal/operativo).

```js
{
  _id, empresaId, leadId, presupuestoId, clienteId,
  items: [ /* mismo shape que presupuesto */ ],
  totales: { subtotal, descuentoTotal, costoEnvio, total },
  estadoLogistico: "pedido_cerrado" | "en_preparacion" | "en_ruta" | "entregado" | "cancelado",
  metodoPagoPreferido: string,
  confirmacionClienteAt: Date,
  cerradoPor: "agente" | "admin",
  cerradoPorUsuarioId: null | string,
  createdAt, updatedAt
}
```

Índices:

- `{ empresaId: 1, estadoLogistico: 1, createdAt: -1 }`
- `{ empresaId: 1, clienteId: 1, createdAt: -1 }`
- `{ empresaId: 1, "items.productoId": 1 }`

### 4.8 `asistente_bots`

Config runtime (singleton por empresa en v1).

```js
{
  _id, empresaId,
  nombre: "Asistente Madomi",
  modelo: "gpt-4.1-mini", // configurable
  temperature: 0.4,
  systemPromptVersion: "v1",
  toolsHabilitadas: ["buscarProductos", "consultarPrecio", ...],
  activo: true,
  updatedAt
}
```

Índices: `{ empresaId: 1 }` unique.

### 4.9 `funciones_asistente`

Catálogo de tools (documentación + schema JSON para LLM).

```js
{
  _id, nombre: "consultarPrecio", version: "1",
  descripcion: "...",
  parametersJsonSchema: { type: "object", properties: {...} },
  handlerInterno: "tools/consultarPrecio.js",
  activo: true
}
```

Índices: `{ nombre: 1, version: 1 }` unique.

### 4.10 `agente_runs` (observabilidad)

```js
{
  _id, conversacionId, mensajeUsuarioId,
  modelo, tokensEntrada, tokensSalida, latenciaMs,
  toolCallsCount, error: null | string,
  createdAt
}
```

Índices: `{ conversacionId: 1, createdAt: -1 }`, TTL opcional 90 días.

---

## 5. Tools del runtime (sin LangChain)

Implementación en `backend/src/asistente/tools/*.js`. Cada tool:

1. Valida args con Zod.
2. Lee/escribe Postgres o Mongo.
3. Devuelve JSON serializable al loop LLM.

| Tool | Fuente | Descripción |
|------|--------|-------------|
| `buscarProductos` | Postgres | `search`, `categoria?`, solo `activo && activoComercial` |
| `consultarPrecio` | Postgres | `productoId`, `tipoCliente: minorista\|mayorista`, aplica oferta vigente |
| `consultarStock` | Postgres | `productoId` |
| `calcularPresupuesto` | Postgres + Mongo | items[] → crea/actualiza `presupuestos` borrador |
| `generarPresupuestoPdf` | Mongo + storage | `presupuestoId` → URL PDF |
| `consultarEnvio` | Postgres `ZonasEnvio` o RAG | `localidad`, `departamento` |
| `buscarPoliticas` | Mongo `empresa_contextos` | chunk retrieval (keyword v1, vector v2) |
| `actualizarLead` | Mongo | merge parcial cliente/lead |
| `cerrarVenta` | Mongo + Postgres stock | validación completa, decrementa stock opcional, crea `pedidos` |

---

## 6. API — `POST /api/chat`

**Auth:** pública (rate limit por IP + `sessionAnonimaId`).  
**Content-Type:** `application/json`  
**Opcional streaming:** `Accept: text/event-stream` (fase 3.1).

### 6.1 Request

```json
{
  "sessionAnonimaId": "550e8400-e29b-41d4-a716-446655440000",
  "mensaje": "Hola, ¿cuánto sale el ravioles de ricota x 500g?",
  "metadata": {
    "canal": "web_chat"
  }
}
```

| Campo | Tipo | Requerido | Reglas |
|-------|------|-----------|--------|
| `sessionAnonimaId` | string UUID | sí | Generado en frontend; persiste en localStorage |
| `mensaje` | string | sí | 1–4000 caracteres, trim |
| `metadata.canal` | string | no | default `web_chat` |

### 6.2 Response 200 (JSON)

```json
{
  "data": {
    "conversacionId": "674a1b2c3d4e5f6789012345",
    "leadId": "674a1b2c3d4e5f6789012346",
    "clienteId": null,
    "respuesta": "¡Hola! El ravioles de ricota x 500 g está a $X para consumidor final...",
    "estadoLead": "consultando",
    "presupuestoId": null,
    "acciones": []
  },
  "error": null,
  "message": null
}
```

`acciones` (opcional UI): `[{ "tipo": "mostrar_presupuesto", "presupuestoId": "..." }, { "tipo": "solicitar_dato", "campo": "telefono" }]`

### 6.3 Errores

| HTTP | error | Cuándo |
|------|-------|--------|
| 400 | `VALIDATION_ERROR` | Zod |
| 429 | `RATE_LIMIT` | exceso requests |
| 503 | `ASISTENTE_NO_DISPONIBLE` | LLM caído o `asistente_bots.activo=false` |
| 500 | `INTERNAL_ERROR` | resto |

### 6.4 SSE (fase 3.1)

Eventos:

- `event: delta` → `{ "text": "fragmento" }`
- `event: done` → mismo payload que `data` en JSON
- `event: error` → `{ "code", "message" }`

### 6.5 Flujo interno (service)

```
chat.controller → chat.service.enviarMensaje()
  → conversacionesRepo.obtenerOCrear(sessionAnonimaId)
  → append mensaje user
  → asistenteLoop.run({ historial, tools })
  → persist mensaje assistant + side effects (lead, presupuesto)
  → return DTO
```

---

## 7. API admin CRM (resumen — `@madomi-backend` + `@madomi-crm`)

Prefijo: `/api/admin/crm` — JWT + permiso futuro `crm.leer` / `crm.escribir` (v1: mismo rol admin CMS).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/leads` | Lista paginada; filtros: `estado`, `desde`, `hasta`, `telefono`, `nombre`, `localidad`, `productoId` |
| GET | `/leads/:id` | Lead + cliente + conversación resumida |
| PATCH | `/leads/:id` | Estado manual, asignación, notas |
| GET | `/conversaciones/:id` | Historial mensajes |
| GET | `/presupuestos` | Filtros por estado, cliente, fechas |
| GET | `/presupuestos/:id/pdf` | Redirect o stream PDF |
| GET | `/pedidos` | Historial ventas |
| PATCH | `/pedidos/:id` | `estadoLogistico` manual |
| GET | `/stats/resumen` | Embudo, productos más consultados, top localidades |
| GET | `/stats/cuello-botella` | Conteo por `cuelloBotella` / abandono |
| POST | `/contexto/publicar` | Subir MD/PDF políticas → nueva versión `empresa_contextos` |

Query común: `?page=1&limit=20&sort=updatedAt&order=desc`

---

## 8. Variables de entorno (nuevas)

Agregar a `backend/.env.example` (cuando se implemente fase 2):

```env
MONGODB_URI=mongodb://localhost:27017/madomi_crm
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
CHAT_RATE_LIMIT_WINDOW_MS=60000
CHAT_RATE_LIMIT_MAX=20
ASISTENTE_EMPRESA_SLUG=madomi
```

`env.js`: `MONGODB_URI` requerida solo si `FEATURE_ASISTENTE=true` (feature flag v1).

---

## 9. Estructura de carpetas backend (objetivo)

```
backend/src/
├── asistente/
│   ├── loop/llmLoop.js
│   ├── tools/
│   ├── prompts/systemV1.js
│   └── rag/buscarPoliticas.js
├── mongo/
│   ├── connection.js
│   ├── models/
│   └── repositories/
├── controllers/chat.controller.js
├── services/chat.service.js
├── routes/chat.routes.js
└── routes/admin/crm.admin.routes.js
```

Montaje en `routes/index.js`:

- `POST /api/chat` → público
- `/api/admin/crm` → autenticado

---

## 10. Validación — cierre de venta (`cerrarVenta`)

Schema Zod (referencia):

```js
{
  leadId: string,
  confirmacionExplicita: literal(true),
  cliente: {
    nombre: string.min(2),
    apellido: string.min(2),
    email: string.email(),
    telefono: string.min(8),
    direccion: string.min(5),
    localidad: string.min(2),
    departamento: string.min(2),
    provincia: string.default("Tucumán")
  },
  items: array.min(1).of({ productoId, cantidad: number.positive() }),
  metodoPagoPreferido: enum(["transferencia","efectivo","qr","cuenta_corriente"])
}
```

Precondiciones: presupuesto `enviado` o ítems recalculados; stock suficiente (o warning + `pendiente_validacion`).

---

## 11. CRM — métricas v1

| Métrica | Cálculo |
|---------|---------|
| Embudo | conteo leads por `estado` / total |
| Conversión | `pedido_cerrado` / `presupuesto_enviado` |
| Tiempo medio etapa | diff timestamps en lead |
| Productos más consultados | aggregate `productosInteres` + items presupuesto |
| Top localidades | group `clientes.localidad` |
| Cuellos | group `leads.cuelloBotella` + tags abandono |

---

## 12. Checklist implementación

- [x] Fase 1: migración Prisma + admin productos comerciales (`@madomi-backend`) — migración `20260924134904_productos_campos_comerciales`
- [x] Fase 2: Mongo + models + seed políticas MD (**crear skill `@madomi-asistente`** con otro agente antes de fase 3)
- [x] Fase 3: `POST /api/chat` + tools precio/stock/buscar
- [x] Fase 3.1: SSE `Accept: text/event-stream` (delta/done/error)
- [x] Fase 4: presupuesto PDF + `cerrarVenta` (runtime tools; PDF requiere Supabase)
- [x] Fase 5: admin CRM API (`@madomi-backend`) + pantallas (`@madomi-crm`, `/admin/comercial/*`)
- [x] Fase 6: widget landing (`@madomi-frontend`, `GET /api/chat/estado`, `POST /api/chat`, `sessionAnonimaId` localStorage)
- [ ] Actualizar `README.md` contrato API
- [ ] Entrada en `decisiones-backend.md`

---

## 13. Referencias cruzadas

- Catálogo ids: `docs/productos.md`
- Políticas prueba: `docs/comercial/politicas-entrega-ejemplo.md`
- Backend capas: `.cursor/skills/madomi-backend/referencia.md`
- Admin UI patrones: `.cursor/skills/madomi-admin/decisiones-admin.md`
