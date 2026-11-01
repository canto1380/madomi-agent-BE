# Producción — chat agente-clientes-ia (fase 4)

Runbook para Madomi Pastas: runtime **agente-clientes-ia** (Cursor Composer cloud + tools + commerce kernel).

## 1. Variables de entorno (backend)

| Variable | Producción |
|----------|------------|
| `NODE_ENV` | `production` |
| `FEATURE_ASISTENTE` | `true` |
| `MONGODB_URI` | Atlas o cluster gestionado |
| `DATABASE_URL` | Postgres prod |
| `ASISTENTE_RUNTIME` | `agente-clientes-ia` |
| `ASISTENTE_LLM_PROVEEDOR` | `auto` o `cursor` |
| `CURSOR_API_KEY` | Secret (Composer cloud) |
| `CURSOR_AGENT_TARGET` | `cloud` |
| `CURSOR_MODEL` | `composer-2.5` (o el acordado) |
| `ASISTENTE_EMPRESA_SLUG` | `madomi` |
| `ASISTENTE_REDACT` | `none` |
| `CORS_ORIGIN` | URL pública del frontend (https://…) |
| `STORAGE_PUBLIC_BASE_URL` | Origen público del API. En producción el PDF y la media nueva van a disco (`STORAGE_DRIVER=local` por default). `STORAGE_LOCAL_DIR` fuera del deploy |
| `CHAT_TURN_TIMEOUT_MS` | `90000` (ajustar según SLA) |
| `CHAT_RATE_LIMIT_MAX` | `20` / ventana (anti-abuso) |

**No usar en prod:** `ASISTENTE_RUNTIME=orchestrador` (legacy).

Al arrancar con `NODE_ENV=production`, el backend ejecuta `validarAsistenteProduccion()` (falla si chat activo sin API key LLM).

## 2. Variables frontend

```env
VITE_API_URL=https://api.tudominio.com
VITE_ENABLE_CHAT_WIDGET=true
VITE_CHAT_SSE=true
VITE_CHAT_STREAM_TIMEOUT_MS=120000
```

Build: `npm run build` con esas vars en el entorno de CI/hosting.

## 3. Checklist deploy

1. Migraciones Postgres + seed comercial si aplica.
2. `npm run db:seed:mongo` (empresa, bot, políticas) **una vez** por entorno.
3. Preflight: `cd backend && npm run check:prod:asistente`
4. Smoke eval (contra el mismo `.env` / DB de staging): `npm run test:eval:chat:smoke`
5. Activar bot: Admin → Comercial → Asistente, o `PATCH /api/admin/asistente/bot` `{ "activo": true }`
6. Verificar público: `GET /api/chat/estado` → `disponible: true`
7. Verificar admin: `GET /api/admin/asistente/runtime/salud` (JWT + `comercial.leer`)

## 4. Monitoreo

### Colección `agente_runs` (Mongo)

Cada turno de chat registra: `modelo`, `latenciaMs`, `toolCallsCount`, `error` (TTL índice ~90 días).

### API admin

`GET /api/admin/asistente/runtime/salud?horas=24`

Devuelve: runtime, bot activo, widget disponible, Supabase PDF, rate limit, **métricas agregadas** (turnos, tasa error, latencia, desglose por modelo).

Revisar semanalmente:

- `tasaError` > 5% → revisar logs Cursor / timeouts
- `latenciaPromedioMs` > 60s → prompt compacto, rate limit abuso, o subir timeout con cuidado UX

### Logs servidor

Buscar `[prod]`, `[asistente]`, `CURSOR_*TIMEOUT`, `503 ASISTENTE_NO_DISPONIBLE`.

## 5. Rollback

1. Desactivar widget sin redeploy: `PATCH .../bot` `{ "activo": false }` → `GET /api/chat/estado` → `BOT_INACTIVO`.
2. Emergencia total: `FEATURE_ASISTENTE=false` + reinicio (chat off, landing sigue).

## 6. Post-deploy manual (2 min)

Misma secuencia que eval `presupuesto-flujo-completo` en el widget (sesión incógnito):

1. hola  
2. productos / precio (opcional)  
3. cantidades → contacto → localidad → PDF  

## 7. Seguridad

- No commitear `.env`; rotar `CURSOR_API_KEY` si se expuso.
- Rate limit en `/api/chat` por IP.
- Precios solo vía tools (no en API pública de productos).
