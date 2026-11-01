# Supabase — PDF de presupuestos (asistente comercial)

Esta guía aplica al entorno **local** (`STORAGE_DRIVER=supabase`, el default cuando `NODE_ENV` no es `production`).

En producción (`NODE_ENV=production`) el PDF se guarda en el disco del servidor (`STORAGE_LOCAL_DIR`) y se publica en `{STORAGE_PUBLIC_BASE_URL}/api/uploads/...`. No hace falta el bucket de Supabase para archivos nuevos.

En local, los PDF generados por `generarPresupuestoPdf` se suben al **mismo bucket** que la media del CMS.

## 1. Variables en `backend/.env`

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role (solo backend, nunca en frontend)
SUPABASE_STORAGE_BUCKET=madomi-media
```

Reiniciá el backend después de editar `.env` (`node --watch` no recarga env).

## 2. Bucket en Supabase Dashboard

1. [Supabase](https://supabase.com/dashboard) → tu proyecto → **Storage**.
2. Si no existe, **New bucket** → nombre `madomi-media` (o el valor de `SUPABASE_STORAGE_BUCKET`).
3. **Public bucket**: activado (lectura pública de objetos), **o** políticas RLS de lectura pública (ver abajo).

El backend sube con **service role** (bypass RLS). El link del PDF debe ser abrible por el cliente y por `/api/admin/crm/presupuestos/:id/pdf`.

## 3. Carpeta de presupuestos

| Ruta en el bucket | Uso |
|-------------------|-----|
| `comercial/presupuestos/{presupuestoId}.pdf` | PDF generado por el chat |

No hace falta crear carpetas a mano: el upload las crea.

## 4. Políticas (si el bucket no es 100 % público)

En **Storage → Policies** para `madomi-media`:

- **INSERT/UPDATE** para `service_role` (por defecto con service key en backend).
- **SELECT** público para lectura de PDFs, por ejemplo:

```sql
-- Ejemplo: lectura pública solo bajo comercial/
create policy "Public read presupuestos"
on storage.objects for select
to public
using (
  bucket_id = 'madomi-media'
  and (storage.foldername(name))[1] = 'comercial'
);
```

Ajustá `bucket_id` al nombre real del bucket.

## 5. Verificación rápida

Con `FEATURE_ASISTENTE=true` y Mongo/Postgres levantados:

```bash
cd backend
npm run test:e2e:chat-fase4
```

Si Supabase está bien configurado, el segundo turno (“Generá el PDF del presupuesto”) debe incluir un **Link:** `https://...supabase.co/storage/v1/object/public/.../comercial/presupuestos/....pdf`.

Sin Supabase, el presupuesto queda en **borrador** y el bot responde que falta storage.

## 6. CRM admin

`GET /api/admin/crm/presupuestos/:id/pdf` redirige a `pdfUrl` guardada en Mongo. Requiere permiso `comercial.leer` y presupuesto en estado `enviado` (o con `pdfUrl`).

## 7. Diseño del PDF (modelo PNG → layout en código)

El archivo `backend/src/asistente/presupuesto/plantilla-presupuesto.png` es **solo referencia visual**. El PDF se dibuja en vectorial (PDFKit) según `layoutMadomiV1.js`: logo (desde branding CMS), bloques cliente/fechas, tabla de ítems, totales, condiciones y pie amarillo/gris.

**No** uses `PRESUPUESTO_PDF_PLANTILLA_PATH` — ya no se embebe la imagen en el PDF.

### Previsualizar sin chat

```bash
cd backend
node scripts/preview-pdf-presupuesto.js
# → backend/tmp/presupuesto-preview.pdf
```

Compará side-by-side con tu PNG y ajustá coordenadas en `layoutMadomiV1.js` o overrides en `.env`:

```env
PRESUPUESTO_PDF_LAYOUT={"tabla":{"y":260},"cliente":{"nombreY":145}}
PRESUPUESTO_PDF_DATOS_PAGO={"lineas":["CBU: ...","Alias: madomi.pastas"]}
PRESUPUESTO_PDF_CONDICIONES=Texto condiciones de pago...
PRESUPUESTO_PDF_OTROS_DETALLES=Texto legal / vigencia...
PRESUPUESTO_PDF_IVA_PORCENTAJE=0
PRESUPUESTO_PDF_SITIO_WEB=www.madomipastas.com
```

Logo: se toma de `ConfiguracionBranding.logoUrl` (URL pública o ruta servida por la landing).
Contacto pie: Postgres `contacto` activo.

## Seguridad

- **Nunca** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend ni en el repo.
- Los PDF contienen datos comerciales; la URL pública es aceptable v1 si el `presupuestoId` es difícil de adivinar; en fases posteriores se puede usar URL firmada o bucket privado + proxy admin.
