# Auditoria CRM de consultas

Fecha: 2026-08-24
Estado: borrador para planificacion
Alcance: panel `lamelas`, backend `back-lamelas`, sitio publico `lamelas-web` y flujo agente/WhatsApp.

## 1. Objetivo

Revisar el estado actual del CRM de consultas para definir, en una etapa posterior, un plan de cambios acotado y seguro.

La vision funcional confirmada es:

- Las consultas deben comportarse como un CRM compartido por administradores y vendedores.
- Las consultas web con propiedad deben asignarse al usuario que cargo la propiedad, sea vendedor o admin.
- Las consultas web sin propiedad deben repartirse equitativamente entre vendedores activos.
- Las consultas del agente/WhatsApp deben repartirse equitativamente entre vendedores activos segun el momento de derivacion definido por negocio.
- Debe existir una accion comun para "tomar" una consulta y evitar que quede pendiente o se reasigne.
- Las consultas sin tomar deben distinguirse en las tablas y contarse en el sidebar.

## 2. Modelo actual

### Backend CRM

Archivo principal: `back-lamelas/src/modules/crm/service.ts`

La tabla `leads` actualmente guarda:

- asignacion: `assigned_to`
- origen: `canal`, `canal_ref`
- propiedad: `property_id`
- estado comercial: `estado`
- clasificacion: `clasificacion`

No guarda un estado de toma/lectura independiente. Hoy `assigned_to` cumple varias funciones a la vez: indica responsable, visibilidad del vendedor y, en algunos flujos, si alguien intervino. Eso limita el CRM porque una consulta puede estar correctamente asignada pero todavia no tomada.

Reglas actuales observadas:

- Consulta publica con `property_id`: se valida la propiedad del tenant y se asigna a `property.userId`.
- Consulta publica sin `property_id`: queda sin `assigned_to` y se notifica a admins.
- Consulta manual desde panel: se asigna al usuario que la carga.
- Reasignacion manual: solo admin puede modificar `assigned_to`.

### Agente / WhatsApp

Archivos principales:

- `back-lamelas/src/modules/agent/service.ts`
- `back-lamelas/src/modules/agent/repo.ts`

El agente crea un `Lead` y una `Conversation`. Al abrir la conversacion, el lead queda sin vendedor asignado. La asignacion equitativa ocurre cuando se ejecuta la derivacion a humano:

- sincroniza usuarios activos con rol `agente` hacia `vendedores_agente`
- elige vendedor activo por `ultimo_asignado_at asc nulls first, random()`
- actualiza `lead.assignedTo`
- crea o actualiza el handoff pendiente

La accion actual "Tomar el chat" vive en conversaciones, no en leads. Cierra el handoff como `tomado` y mueve la conversacion a estado humano, pero no deja una marca de toma en la tabla `leads`.

### Panel

Archivos principales:

- `lamelas/src/app/(app)/consultas/page.tsx`
- `lamelas/src/app/(app)/consultas/[id]/page.tsx`
- `lamelas/src/components/leads/lead-table.tsx`
- `lamelas/src/components/leads/lead-row.tsx`
- `lamelas/src/components/leads/lead-conversation.tsx`
- `lamelas/src/actions/leads.ts`
- `lamelas/src/actions/conversations.ts`
- `lamelas/src/lib/queries.ts`
- `lamelas/src/lib/types.ts`

El panel lista consultas desde `/v1/leads` y oculta conversaciones del agente web con `excluir_agente_web=true`.

Actualmente:

- No hay campo de "tomado" en los tipos del panel.
- No hay boton universal para tomar lead.
- El boton existente "Tomar el chat" aparece solo si hay conversacion.
- No hay distintivo de "sin tomar" en tabla/card.
- El contador del sidebar usa resumen general de consultas nuevas (`estado=nueva`), no consultas sin tomar.

### Sitio publico

Archivo relevante: `lamelas-web/src/pages/PropertyDetail.tsx`

El backend ya estaba preparado para asignar correctamente consultas con propiedad, pero dependia de recibir `property_id`. En dev ya se corrigio el envio de `property_id` desde la ficha publica de propiedad. Este punto debe entrar al merge/deploy para que la regla funcione en produccion.

## 3. Hallazgos

### H1. Falta estado de toma a nivel lead

Impacto: alto.

El CRM necesita distinguir entre:

- consulta asignada a un responsable
- consulta tomada/leida por una persona
- etapa comercial (`nueva`, `en_contacto`, `ganada`, `perdida`)

Hoy solo existe `assigned_to` y `estado`. Esto hace dificil mostrar "sin tomar", contar pendientes reales y evitar reasignaciones accidentales.

Recomendacion:

- Agregar `leads.tomado_at timestamptz null`.
- Agregar `leads.tomado_por uuid null references users(id) on delete set null`.
- Mantener `estado` como etapa comercial, no usarlo como lectura.

Opcional:

- Agregar `assigned_at timestamptz null` si se quiere auditar tiempos de asignacion.

### H2. Web con propiedad funciona en backend, pero depende del `property_id`

Impacto: alto.

La regla backend es correcta: si llega `property_id`, el lead se asigna al usuario dueño de la propiedad. Esto incluye admin si el admin cargo la propiedad.

El problema detectado estaba en el sitio publico: la ficha de propiedad no enviaba `property_id`. En dev ya esta corregido.

Recomendacion:

- Mantener la regla actual: `assigned_to = property.user_id`.
- Agregar test explicito para propiedad creada por admin.
- Asegurar merge/deploy del fix del sitio publico.

### H3. Web sin propiedad queda sin vendedor

Impacto: alto.

Las consultas web generales, sin propiedad, quedan sin asignar y se notifican a admins. Esto no cumple la vision de reparto equitativo entre vendedores activos.

Recomendacion:

- Reutilizar o extraer una politica de round-robin para leads.
- En `createPublicLead`, si no hay `property_id`, asignar a un vendedor activo.
- Definir fallback si no hay vendedores activos: dejar sin asignar y notificar admins, o fallar el alta. Recomendacion: no fallar el alta publica; dejar sin asignar y notificar admins.

### H4. La asignacion equitativa esta acoplada al modulo agente

Impacto: medio/alto.

El round-robin ya existe en `agent/repo.ts`, apoyado en `vendedores_agente`. Pero hoy esta pensado para handoffs del agente, no como servicio comun de asignacion CRM.

Recomendacion:

- Extraer la seleccion de vendedor activo a un helper compartido o modulo de CRM.
- Evitar duplicar SQL de round-robin entre `crm` y `agent`.
- Mantener bloqueo transaccional (`for update skip locked`) para evitar doble asignacion concurrente.

### H5. WhatsApp tiene toma de conversacion, pero no toma de lead

Impacto: medio/alto.

El handoff registra `tomado` en la tabla de handoffs, pero la tabla `leads` no refleja ese estado. Por eso el listado de consultas no puede marcar de forma uniforme si una consulta fue tomada.

Recomendacion:

- Crear una accion universal `POST /v1/leads/:id/take`.
- Si el lead tiene conversacion activa, la accion debe coordinar con el flujo de conversacion.
- El boton "Tomar el chat" deberia actualizar tambien `leads.tomado_at/tomado_por`, o delegar en el endpoint universal.

### H6. Falta boton universal "Tomar lead"

Impacto: alto para CRM.

Los leads web sin conversacion no tienen una accion equivalente a "Tomar el chat". Esto deja al equipo sin una forma clara de bloquear el lead como atendido.

Recomendacion:

- Mostrar boton en el detalle de cualquier lead sin `tomado_at`.
- Permitir tomar a admin o al vendedor asignado.
- Si el lead no tiene `assigned_to`, asignarlo al usuario que lo toma.
- Si el lead ya fue tomado, no reasignarlo por esta accion.

Decision a cerrar:

- Si un admin toma un lead asignado a un vendedor, `assigned_to` cambia al admin: tomar implica asumir la responsabilidad operativa.

### H7. Falta distintivo y contador de consultas sin tomar

Impacto: medio/alto.

El panel puede contar `estado=nueva`, pero eso no equivale a "sin tomar". Una consulta puede estar nueva pero tomada, o en contacto pero nunca marcada como tomada.

Recomendacion:

- Agregar filtro backend `tomado=false` o `sin_tomar=true`.
- Agregar conteo dedicado para sidebar.
- Mostrar badge "Sin tomar" en tabla y cards.
- En el detalle, mostrar quien tomo y cuando.

### H8. RLS y permisos deben revisarse con cada endpoint nuevo

Impacto: alto.

El backend usa RLS como garantia real de autorizacion. Cualquier nuevo campo o accion de toma debe respetar:

- admin ve y puede operar leads de su tenant
- vendedor ve leads asignados a el o leads de sus propiedades segun policy actual
- vendedor no puede tomar leads ajenos
- otro tenant no puede ver ni tomar
- agente/API key solo opera dentro del tenant correspondiente

Recomendacion:

- Agregar migracion de schema.
- Si se agrega endpoint de toma, cubrirlo con tests de integracion y RLS.
- No depender solo de checks de handler.

## 4. Reglas funcionales recomendadas

### Creacion de leads

| Origen | Con propiedad | Sin propiedad |
| --- | --- | --- |
| Web publica | asignar al usuario dueño de la propiedad | asignar round-robin a vendedor activo |
| WhatsApp/agente | decision pendiente: si la propiedad debe dominar, asignar al dueño; si no, mantener handoff round-robin | asignar round-robin al derivar a humano |
| Manual panel | asignar al usuario que carga | asignar al usuario que carga |

Nota: para WhatsApp conviene confirmar si se quiere asignar desde el primer mensaje o recien cuando el agente deriva a humano. El comportamiento actual asigna al derivar.

### Toma de leads

Regla propuesta:

- Un lead se considera sin tomar cuando `tomado_at is null`.
- Tomar un lead setea `tomado_at=now()` y `tomado_por=current_user`.
- Tomar no cambia `estado` automaticamente.
- Tomar reasigna el lead al usuario que realiza la accion.
- Tomar un lead sin responsable lo asigna al usuario que lo toma.
- Una vez tomado, no debe entrar en procesos automaticos de reasignacion.

## 5. Cambios tecnicos recomendados para planificar

### Backend

- Migracion Prisma/Postgres:
  - `leads.tomado_at`
  - `leads.tomado_por`
  - indice parcial opcional por tenant para pendientes: `(tenant_id, created_at) where tomado_at is null`
- Prisma schema:
  - campos nuevos en `Lead`
  - relacion opcional con `User` para `tomadoPor`
- API CRM:
  - extender serializacion/listado/detalle con `tomado_at` y `tomado_por`
  - agregar filtro `sin_tomar`
  - agregar contador o incluir `sin_tomar` en stats
  - agregar `POST /v1/leads/:id/take`
- Asignacion:
  - extraer helper round-robin reutilizable
  - usarlo en web sin propiedad
  - mantenerlo en derivacion WhatsApp
- Eventos:
  - emitir `lead.updated` o `lead.taken` al tomar, segun contrato de webhooks

### Panel

- Tipos:
  - agregar `tomado_at`
  - agregar `tomado_por`
- Queries:
  - mapear campos nuevos
  - sumar helper para contador de sin tomar
- Acciones:
  - `takeLead`
- Listado:
  - badge "Sin tomar"
  - filtro opcional "Sin tomar" si se decide incluirlo
- Detalle:
  - boton universal "Tomar lead"
  - mostrar fecha/persona que tomo
  - coordinar con chat si existe conversacion
- Sidebar:
  - badge de consultas sin tomar en el item "Consultas"

### Sitio publico

- Mantener el envio de `property_id` desde ficha de propiedad.
- Verificar que formularios generales no envien propiedad falsa.
- Agregar una prueba manual o automatizada del payload de contacto.

## 6. Tests recomendados

### Backend CRM

- Public web con propiedad de vendedor: queda asignado al vendedor.
- Public web con propiedad de admin: queda asignado al admin.
- Public web sin propiedad: reparte entre vendedores activos.
- Public web sin vendedores activos: crea lead sin asignar y notifica admins.
- `POST /leads/:id/take`:
  - vendedor asignado puede tomar
  - admin puede tomar dentro de su tenant
  - vendedor ajeno no puede tomar
  - otro tenant no puede tomar
  - no sobrescribe `tomado_por` si ya estaba tomado
- Filtro/contador `sin_tomar` respeta tenant y permisos.

### Agente / WhatsApp

- Handoff asigna con round-robin.
- Tomar conversacion marca tambien el lead como tomado.
- Lead tomado no se reasigna por timeout/handoff posterior sin decision explicita.

### Panel

- Typecheck y build.
- Tabla muestra badge "Sin tomar" cuando corresponde.
- Detalle muestra boton universal solo cuando corresponde.
- Sidebar muestra contador correcto por rol.

## 7. Riesgos y decisiones pendientes

### Decisiones pendientes

- WhatsApp: asignar al primer contacto o solo al derivar a humano.
- Admin tomando lead asignado: reasignar al admin, confirmado.
- Consulta web con propiedad cargada por admin: queda asignada al admin, confirmado.
- Fallback sin vendedores activos: recomendado crear sin asignar y alertar admins.

### Riesgos

- Mezclar `assigned_to` con "tomado" puede seguir generando errores si no se agregan campos nuevos.
- Cambios de RLS sin tests pueden romper visibilidad de vendedores o filtrar leads legitimos.
- Duplicar la logica round-robin en CRM y agente puede producir repartos inconsistentes.
- Si el contador del sidebar usa `estado=nueva`, va a medir otra cosa y confundira al equipo.

## 8. Conclusiones

El flujo web con propiedad esta bien definido en backend y debe seguir asignando al usuario que cargo la propiedad, incluido admin. El fix critico del sitio publico es enviar `property_id`, que ya esta corregido en dev.

El cambio estructural mas importante para convertir consultas en un CRM real es separar asignacion de toma. La recomendacion es agregar `tomado_at` y `tomado_por` a `leads`, implementar un endpoint universal para tomar lead y reutilizar una logica comun de asignacion equitativa para consultas web sin propiedad y handoffs de WhatsApp.

Con esta auditoria, el siguiente paso deberia ser convertir los hallazgos en una planificacion por fases: primero modelo/API/tests, despues panel, y por ultimo ajustes finos de UX y metricas.
