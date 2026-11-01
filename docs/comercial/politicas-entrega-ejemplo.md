# Políticas comerciales — Madomi Pastas

> **Uso:** material de prueba para el agente runtime (RAG / consulta estructurada).  
> **Versión:** 2026-09-23 · **Vigencia:**.  
> **Fuente humana prevista:** PDF editado por Madomi → conversión a Markdown versionado.

---

## 1. Alcance y definiciones

### 1.1 Qué cubre este documento

- Zonas y días de entrega en Gran Tucumán y departamentos aledaños.
- Plazos habituales y demoras excepcionales.
- Costos de envío y condiciones de envío gratis.
- Retiro en fábrica / depósito.
- Pedidos mayoristas vs minoristas (referencia operativa; **precios y stock vigentes se consultan por sistema**, no por este texto).
- Productos frescos: conservación y ventanas horarias.
- Cambios, cancelaciones y reclamos logísticos.

### 1.2 Definiciones

| Término | Significado |
|--------|-------------|
| **Pedido cerrado** | Cliente confirmó ítems, cantidades y datos de contacto; venta registrada en CRM. |
| **Presupuesto** | Cotización sin compromiso de stock hasta confirmación. |
| **Gran Tucumán** | Capital, Yerba Buena, Tafí Viejo, Alderetes, Banda del Río Salí, Las Talitas, El Manantial, San Andrés, Lomas de Tafí (referencia operativa). |
| **Mayorista** | Comercio, gastronomía o revendedor con cuenta habilitada y mínimos por categoría. |
| **Minorista / consumidor final** | Compra para uso familiar; puede retirar o pedir envío según zona. |

---

## 2. Datos de contacto operativos (logística)

- **Razón social:** Madomi Pastas  
- **Dirección de retiro:** Rivadavia 1891, San Miguel de Tucumán, Tucumán, Argentina  
- **Horario de atención al público (retiro):** Lunes a viernes 08:00–13:00 y 16:00–19:00; sábados 08:00–13:00.  
- **Canal comercial asistido:** chat web, WhatsApp comercial (número publicado en la landing), teléfono de la fábrica.  
- **Ventana de producción:** pedidos confirmados antes de las **15:00** entran preferentemente al circuito del **día hábil siguiente**; después de las 15:00 pueden pasar al **segundo día hábil** según carga de planta.

---

## 3. Zonas de entrega

### 3.1 Zona A — Capital y cordón inmediato

**Localidades incluidas:** San Miguel de Tucumán (todas las zonas), Villa Urquiza, Barrio Norte, Barrio Sur, Centro, San Roque, El Bosque, Parque Avellaneda, San Cayetano, Los Pocitos, Villa Luján.

| Concepto | Detalle |
|----------|---------|
| Días de reparto | Lunes a viernes |
| Turnos | Mañana 09:00–13:00 · Tarde 16:00–20:00 |
| Plazo desde pedido cerrado | 1 día hábil (confirmado antes de 15:00) · 2 días hábiles (confirmado después de 15:00) |
| Pedido mínimo envío minorista | $25.000 ARS (equivalente aproximado; ajustar en sistema) |
| Costo de envío minorista | $4.500 ARS fijo por envío |
| Envío gratis minorista | Pedidos desde **$45.000 ARS** en Zona A |

### 3.2 Zona B — Gran Tucumán extendida

**Localidades incluidas:** Yerba Buena, Tafí Viejo, Alderetes, Banda del Río Salí, Las Talitas, El Manantial, San Andrés, Lomas de Tafí, Colón (parcial según calle — confirmar localidad exacta).

| Concepto | Detalle |
|----------|---------|
| Días de reparto | Martes, jueves y sábado |
| Turnos | Mañana 09:00–13:00 |
| Plazo desde pedido cerrado | 2 a 3 días hábiles |
| Pedido mínimo envío minorista | $30.000 ARS |
| Costo de envío minorista | $6.500 ARS |
| Envío gratis minorista | Pedidos desde **$60.000 ARS** en Zona B |

**Nota:** Si la localidad no figura en la lista, el agente debe solicitar **localidad + departamento + referencia de calle** y marcar el lead para **validación manual** antes de prometer fecha.

### 3.3 Zona C — Interior del departamento Tucumán

**Localidades incluidas:** Aguilares, Bella Vista, Concepción, Famaillá, La Cocha, Monteros (solo días programados), Simoca (ruta consolidada miércoles).

| Concepto | Detalle |
|----------|---------|
| Días de reparto | Según ruta semanal (consultar calendario de la semana en CRM) |
| Plazo desde pedido cerrado | 3 a 5 días hábiles |
| Pedido mínimo | $50.000 ARS minorista · mayorista según cuenta |
| Costo de envío | A cotizar según kilómetros y volumen; el agente **no inventa montos** — usar tool `cotizarEnvio` o derivar a operador |
| Cadena de frío | Obligatoria en verano (noviembre–marzo) para ciertos productos; puede haber recargo |

### 3.4 Zona D — Otros departamentos (NO estándar)

Entregas a **departamentos fuera de Tucumán** solo con acuerdo previo, transporte tercerizado o retiro en fábrica. Plazo **no garantizado** en chat automático; crear lead con estado `pendiente_validacion_logistica`.

---

## 4. Retiro en fábrica

| Concepto | Detalle |
|----------|---------|
| Disponibilidad | Lunes a viernes 08:00–13:00 y 16:00–19:00; sábados 08:00–13:00 |
| Plazo de preparación | 4 horas mínimo si hay stock; 24 h si incluye producción |
| Identificación | Nombre completo + número de pedido o últimos 4 dígitos del teléfono |
| Pago en retiro | Efectivo, transferencia o QR según habilitación del cliente (confirmar en cierre de venta) |
| Estacionamiento | Calle Rivadavia; evitar horario pico 17:30–19:00 |

---

## 5. Mayorista vs minorista (logística)

### 5.1 Mayorista

- Entrega en **horarios pactados** por ruta fija (ej.: gastronomía centro: lun/mié/vie AM).
- Mínimos por línea (ravioles, sorrentinos, etc.) definidos en **lista de precios del sistema** — no en este documento.
- Cambios de último momento: hasta **2 horas antes** del turno de ruta asignado, sujeto a producción.
- Facturación: CUIT/CUIL y condición fiscal obligatorios para cuenta mayorista; el agente debe capturarlos antes de cerrar venta mayorista.

### 5.2 Minorista

- Envío según zonas 3.1–3.3 o retiro en fábrica.
- Sin cuenta corriente salvo excepción aprobada por administración.

---

## 6. Demoras, feriados y fuerza mayor

### 6.1 Demoras habituales (comunicar al cliente)

| Causa | Demora adicional típica |
|-------|-------------------------|
| Alta demanda (fines de semana largos, Pascuas, Navidad) | +1 a +2 días hábiles |
| Falta puntual de insumo | Reemplazo sugerido o reprogramación; agente registra producto alternativo en el lead |
| Clima extremo (lluvia intensa, calor >38 °C) | Puede mover turno tarde; priorizar cadena de frío |
| Pedido incompleto de datos | No se despacha hasta completar dirección, teléfono y localidad |

### 6.2 Feriados nacionales en Tucumán

No se realizan entregas minoristas en feriado inamovible. Pedidos del feriado pasan al **primer día hábil siguiente**. Lista anual mantenida en CRM (`EmpresaContexto.calendarioFeriados`).

### 6.3 Fuerza mayor

Incendios, corte de ruta, falla de vehículo: operaciones notifica por WhatsApp masivo a leads del día; el agente no promete compensación automática — escalar a humano.

---

## 7. Productos frescos — conservación y ventanas

- Pastas frescas refrigeradas: consumo recomendado **3 a 5 días** desde elaboración (fecha en etiqueta).
- **No** garantizar entrega fuera de ventana de refrigeración en verano para Zona C sin cadena de frío confirmada.
- Humita, guisos y rellenos cocidos: prioritario turno mañana en Zona B y C.
- El agente debe advertir: *“Producto fresco, mantener refrigerado”* en cierre de venta con envío.

---

## 8. Seguimiento de pedido (qué puede decir el agente)

| Estado interno CRM | Mensaje al cliente |
|--------------------|------------------------------|
| `presupuesto_abierto` | “Tu cotización está en preparación.” |
| `presupuesto_enviado` | “Te enviamos el presupuesto; confirmá para reservar producción.” |
| `pedido_cerrado` | “Pedido registrado; preparación estimada: [fecha según zona].” |
| `en_preparacion` | “Estamos elaborando tu pedido en planta.” |
| `en_ruta` | “Salió en reparto; turno [mañana/tarde].” |
| `entregado` | “Entrega confirmada. ¡Gracias por elegir Madomi!” |
| `pendiente_validacion_logistica` | “Un asesor valida envío a tu localidad y te confirma costo y fecha.” |

El agente **solo** informa estados existentes en CRM vinculados al teléfono o ID de conversación; si no hay match, pedir teléfono y buscar de nuevo.

---

## 9. Cambios, cancelaciones y reclamos

### 9.1 Cancelación

- **Antes de producción:** sin cargo; reintegrar seña si hubo transferencia (48 h hábiles).
- **Después de producción:** no cancelable total; posible acuerdo parcial vía operador humano.

### 9.2 Modificación de ítems

Hasta **3 horas antes** del inicio de preparación, sujeto a stock (consultar tool de stock).

### 9.3 Reclamos por faltante o calidad

- Plazo: **24 horas** desde entrega.
- Solicitar foto + número de pedido.
- Crear ticket en CRM (`tipo: reclamo_logistico`); agente no autoriza reenvío sin regla automática habilitada.

---

## 10. Pagos (referencia para el agente)

| Modalidad | Cuándo aplica |
|-----------|----------------|
| Transferencia / alias | Presupuesto mayorista; seña minorista opcional |
| Efectivo / QR en entrega | Minorista Zona A y B |
| Cuenta corriente | Solo mayoristas habilitados |

El agente **no** procesa pagos en chat; registra método preferido y adjunta instrucciones estándar del CRM.

---

## 11. Privacidad y datos personales

Para cerrar venta se requieren: **nombre, apellido, email, teléfono, dirección, localidad, departamento (Tucumán u otro)**.  
Los datos se usan para entrega, facturación y seguimiento comercial de Madomi Pastas.  
El cliente puede pedir no recibir promociones; registrar preferencia en el perfil `Cliente`.

---

## 12. Preguntas frecuentes (FAQ)

**¿Entregan el mismo día?**  
Solo retiro en fábrica con stock disponible y pedido antes de las 11:00, o envío express Zona A bajo cupo diario (máx. 5 envíos/día) con recargo — validar con operador si no hay tool `envioExpressDisponible`.

**¿Puedo combinar mayorista y minorista en un envío?**  
No en un mismo pedido cerrado; generar dos presupuestos o unificar bajo cuenta mayorista.

**¿Hacen envíos a Jujuy / Salta?**  
Zona D; no prometer fecha ni costo sin validación.

**¿Los precios del chat son finales?**  
Los montos salen del **sistema de precios vigente** al momento del presupuesto; producción o impuestos pueden actualizar totales solo si el presupuesto expiró (validez **72 horas** salvo oferta marcada).

**¿Qué pasa si no estoy en casa?**  
Segundo intento al día hábil siguiente en Zona A; en otras zonas, reprogramación con costo adicional posible.

---

## 13. Metadatos para indexación (RAG)

```yaml
documento: politicas-entrega-madomi
version: "2026-09-23"
idioma: es-AR
empresa: Madomi Pastas
departamento_base: Tucumán
tags:
  - entrega
  - envio
  - zonas
  - demoras
  - mayorista
  - minorista
  - retiro
  - reclamos
  - frescos
secciones_indexables:
  - id: zonas
    titulo: "Zonas de entrega"
  - id: plazos
    titulo: "Plazos y demoras"
  - id: costos_envio
    titulo: "Costos de envío"
  - id: retiro
    titulo: "Retiro en fábrica"
  - id: faq
    titulo: "Preguntas frecuentes"
```

---

## 14. Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-09-23 | Versión inicial de prueba para desarrollo del agente |
