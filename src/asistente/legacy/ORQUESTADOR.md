# Runtime legacy — orquestador + `interpretarTurno`

**Congelado desde fase 2 (agente-clientes-ia).** No agregar reglas NLU ni copy aquí.

## Cuándo existe

- `ASISTENTE_RUNTIME=orchestrador` en `.env` (solo regresión local o comparación).
- Archivos: `loop/orchestradorLoop.js`, `conversacion/interpretarTurno.js`, `redactarRespuestaConversacional.js`, `debeRedactarTurno.js`.

## Producción

Default del repo: **`agente-clientes-ia`** (Cursor + tools + commerce kernel).

Cambios de conversación → `docs/comercial/prompt-agente-clientes-ia-runtime.md` y prompt maestro.  
Cambios de cierre comercial → `commerce/kernelPostTurno.js` y tools.

## Eliminar (futuro)

Cuando no haya dependencia de E2E sobre orquestador, se puede archivar `interpretarTurno` y simplificar el repo.
