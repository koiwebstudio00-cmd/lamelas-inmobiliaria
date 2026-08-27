# Plan CRM de consultas

Fecha: 2026-08-24
Base: `docs/auditoria-crm-consultas.md`
Objetivo: completar el CRM de consultas con cambios graduales, verificables y reversibles por etapa.

## Principios del plan

- Separar asignacion de toma: `assigned_to` indica responsable actual; `tomado_por/tomado_at` registra quien tomo la consulta y cuando. Tomar transfiere la responsabilidad al usuario que realiza la accion.
- No romper el flujo web con propiedad: debe seguir asignando al usuario que cargo la propiedad, incluido admin.
- No perder consultas publicas: si no hay vendedores activos, el lead debe crearse igual.
- Validar backend antes de tocar UI dependiente.
- Cada fase debe cerrar con pruebas o chequeos concretos antes de pasar a la siguiente.

## Estado de implementacion

Ultima actualizacion: 2026-08-24.

Equivalencias de nombres usadas en este documento:

- `back-lamelas` corresponde al repo actual `back-lamela`.
- `lamelas` corresponde al repo actual `lamelas-sistema`.

| Fase | Estado | Resultado |
| --- | --- | --- |
| 0. Criterios | completada | Reglas de asignacion, toma, fallback y WhatsApp cerradas |
| 1. Modelo de toma | implementada | `tomado_at`, `tomado_por`, relacion con usuario e indice de pendientes personales |
| 2. Endpoint universal | implementada | `POST /v1/leads/:id/take`, idempotente, atomico y protegido por RLS |
| 3. Round-robin web | implementada | Web general y agente comparten reparto; se excluyen vendedores inactivos/no disponibles |
| 4. WhatsApp y toma | implementada | Tomar chat toma el lead sin reasignarlo; timeout no reasigna leads tomados |
| 5. Panel | pendiente | Tipos, boton universal, datos de toma y badge visual |
| 6. Contador personal | pendiente | Consultas asignadas al usuario actual con `tomado_at is null` |
| 7. Verificacion E2E | pendiente | Flujo completo con BD de test y panel |

Implementacion acumulada en `back-lamela`:

- Migracion `20260824000000_lead_toma`: campos de toma, FK e indice parcial por tenant/responsable.
- Migracion `20260824100000_lead_take_rls`: acceso seguro a leads libres y transicion de conversaciones.
- Migracion `20260824200000_public_lead_assignment_rls`: reparto desde el alta publica en contexto `auth`.
- Nuevo repo CRM para toma transaccional y modulo compartido de asignacion round-robin.
- Contrato de API y webhooks actualizado.
- Pruebas agregadas en `test/crm.test.ts` y `test/agent.test.ts`.

Validacion disponible:

- Prisma generate, lint, typecheck y build: correctos.
- Suites sin BD: 16 tests aprobados.
- Las pruebas CRM, agente y RLS que requieren Postgres estan escritas pero no se pudieron ejecutar: el entorno local no tiene `DATABASE_URL_TEST` configurada y Docker no esta disponible. Las fases 1 a 4 se consideran implementadas, con validacion de integracion pendiente antes de deploy.

Reglas confirmadas durante la implementacion:

- Tomar un lead libre tambien lo asigna al usuario que lo toma.
- Tomar un lead ya asignado no cambia su responsable; reasignar es una accion manual aparte.
- Si un admin tiene un lead asignado y lo toma, el lead sigue siendo del admin hasta una reasignacion manual.
- El contador futuro es personal: `assigned_to = usuario_actual and tomado_at is null`. No es el total del tenant ni equivale a `estado = nueva`.

## Regla funcional objetivo

| Origen | Asignacion | Toma |
| --- | --- | --- |
| Web con propiedad | usuario que cargo la propiedad | manual desde CRM |
| Web sin propiedad | round-robin entre vendedores activos | manual desde CRM |
| WhatsApp/agente | round-robin al derivar a humano | al tomar chat/lead |
| Manual panel | usuario que carga el lead | opcional: puede quedar tomado por quien carga o pendiente, a definir antes de implementar |

Decision recomendada para manuales: dejarlos asignados al creador pero sin tomar, salvo que el negocio quiera considerarlos ya tomados.

## Fase 0. Congelar criterios y baseline

Objetivo: dejar confirmadas las reglas antes de modificar BD.

Cambios:

- Confirmar que consulta web con propiedad cargada por admin se asigna al admin.
- Confirmar que WhatsApp se asigna al derivar a humano, no al primer mensaje.
- Confirmar fallback sin vendedores activos: crear lead sin asignar y notificar admins.
- Confirmar que tomar un lead asignado transfiere la responsabilidad al usuario que lo toma.

Chequeo:

- Sin cambios de codigo.
- Documento actualizado con decisiones finales si cambia alguna regla.

Salida esperada:

- Reglas cerradas para implementar fases 1 a 5.

## Fase 1. Modelo de datos para toma de leads

Objetivo: agregar la informacion minima para saber si una consulta fue tomada.

Backend:

- Agregar migracion:
  - `leads.tomado_at timestamptz null`
  - `leads.tomado_por uuid null references users(id) on delete set null`
  - indice opcional para pendientes por tenant: `(tenant_id, created_at) where tomado_at is null`
- Actualizar `prisma/schema.prisma`.
- Exponer los campos en listado y detalle de leads:
  - `tomado_at`
  - `tomado_por`
  - datos basicos del usuario que tomo, si aplica

Tests:

- Prisma/typecheck compila con los nuevos campos.
- `GET /v1/leads` devuelve leads existentes con `tomado_at=null`.
- `GET /v1/leads/:id` devuelve `tomado_por=null` si no fue tomado.
- RLS sigue aislando tenants.

Comandos de cierre:

- `npx tsc --noEmit`
- tests CRM existentes

Criterio para avanzar:

- La app sigue funcionando igual que antes, solo con campos nuevos en la API.

## Fase 2. Endpoint universal para tomar lead

Objetivo: implementar una accion unica de CRM para marcar una consulta como tomada.

Backend:

- Agregar `POST /v1/leads/:id/take`.
- Reglas:
  - Si `tomado_at` ya existe, responder idempotente con el lead sin modificarlo.
  - Si el lead tiene `assigned_to`, puede tomarlo admin o el usuario asignado; quien lo toma pasa a ser el nuevo `assigned_to`.
  - Si el lead no tiene `assigned_to`, puede tomarlo admin o vendedor del tenant; al tomarlo se setea tambien `assigned_to=current_user`.
  - No cambiar `estado` automaticamente.
  - Emitir evento `lead.updated` o `lead.taken`.
- Coordinar con conversacion si existe:
  - si hay handoff pendiente, cerrarlo como `tomado`
  - si corresponde, mover conversacion a `humano`

RLS/permisos:

- Verificar que vendedor ajeno no pueda tomar leads asignados a otro.
- Verificar que otro tenant no pueda tomar.
- Mantener checks fail-fast en service, pero apoyarse en RLS.

Tests:

- Vendedor asignado toma correctamente.
- Admin toma lead de su tenant.
- Admin que toma un lead asignado pasa a ser su responsable.
- Lead sin asignar queda asignado y tomado por quien lo toma.
- Vendedor ajeno recibe forbidden/not found segun patron actual.
- Tomar dos veces no pisa `tomado_por/tomado_at`.
- Otro tenant no puede tomar.

Comandos de cierre:

- `npx tsc --noEmit`
- `npm test -- crm`
- test de agente si se toca conversacion/handoff

Criterio para avanzar:

- La accion existe y esta cubierta por tests antes de mostrar botones en UI.

## Fase 3. Asignacion equitativa para web sin propiedad

Objetivo: que las consultas web generales entren con responsable activo.

Backend:

- Extraer la logica round-robin del modulo agente a un helper compartido.
- Usar ese helper en `createPublicLead` cuando no venga `property_id`.
- Mantener regla actual para web con propiedad: asignar a `property.userId`.
- Si no hay vendedores activos:
  - crear lead sin asignar
  - notificar admins
  - no fallar el formulario publico

Tests:

- Web con propiedad de vendedor queda asignada al vendedor.
- Web con propiedad de admin queda asignada al admin.
- Web sin propiedad reparte entre vendedores activos.
- Web sin propiedad no asigna a usuarios inactivos.
- Sin vendedores activos crea lead sin asignar.
- Cross-tenant con property_id sigue rechazado.

Comandos de cierre:

- `npx tsc --noEmit`
- `npm test -- crm`

Criterio para avanzar:

- La asignacion web queda correcta sin cambiar todavia la experiencia visual del panel.

## Fase 4. Integracion WhatsApp/agente con toma de lead

Objetivo: unificar la toma del chat con la toma del lead.

Backend:

- Ajustar `tomarConversacion` para marcar tambien:
  - `lead.tomado_at`
  - `lead.tomado_por`
- Evitar que timeouts o reasignaciones automaticas pisen leads ya tomados.
- Mantener round-robin al derivar a humano.

Tests:

- Handoff asigna a vendedor activo por round-robin.
- Tomar conversacion setea `tomado_at/tomado_por` en lead.
- Tomar conversacion dos veces no pisa datos de toma.
- Reasignacion por timeout no afecta lead ya tomado.

Comandos de cierre:

- `npx tsc --noEmit`
- `npm test -- agent`
- tests CRM si comparten helper

Criterio para avanzar:

- WhatsApp queda consistente con el CRM aunque el panel todavia no muestre todos los indicadores.

## Fase 5. Panel: datos, boton universal y distintivos

Objetivo: exponer en UI lo que ya soporta el backend.

Panel:

- Actualizar tipos `Lead` y `LeadDetalle`:
  - `tomado_at`
  - `tomado_por`
- Mapear campos nuevos en `src/lib/queries.ts`.
- Agregar server action `takeLead` en `src/actions/leads.ts`.
- En detalle de consulta:
  - mostrar boton "Tomar lead" si no fue tomado
  - mostrar quien lo tomo y cuando si ya fue tomado
  - mantener "Tomar el chat" solo si aporta comportamiento especifico de conversacion, o reemplazarlo por accion universal
- En tabla y cards:
  - mostrar badge "Sin tomar"
  - no cambiar layout general

Tests/chequeos:

- Typecheck.
- Build del panel.
- Prueba manual:
  - lead web sin tomar muestra badge
  - tomar lead actualiza detalle
  - al volver al listado desaparece badge
  - lead de WhatsApp tomado desde chat tambien queda tomado

Comandos de cierre:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Criterio para avanzar:

- El equipo ya puede operar leads web y WhatsApp desde una accion comun.

## Fase 6. Contador de consultas sin tomar en sidebar

Objetivo: mostrar a cada usuario cuantas consultas tiene asignadas y todavia no atendio, sin mezclarlo con `estado=nueva`.

Backend:

<<<<<<< HEAD
- Agregar un conteo calculado por el backend con el usuario autenticado:
  - `assigned_to = current_user`
  - `tomado_at is null`
- No aceptar un `assigned_to` arbitrario enviado por el panel para calcular este contador.
- Las consultas sin asignar no cuentan para ningun usuario.
=======
- Agregar soporte de conteo:
  - opcion A: extender `/v1/leads/stats` con `sin_tomar`
  - opcion B: permitir `GET /v1/leads?sin_tomar=true&limit=1` y usar `meta.total`
- Decision implementada: opcion B, para reutilizar el listado ya habilitado para ambos roles y su visibilidad RLS sin ampliar el endpoint de stats exclusivo de admin.
>>>>>>> 8b790a39e8a7e5260eed30bb3abf36bcbfa7fbcd

Panel:

- Crear helper `getConsultasSinTomarCount`.
- En layout de app, obtener contador junto con usuario actual.
- Pasar contador a `AppNav`.
- Mostrar badge en item "Consultas".

Tests/chequeos:

- Admin ve solo sus propias consultas asignadas sin tomar, no el total del tenant.
- Vendedor ve solo sus propias consultas asignadas sin tomar.
- Sidebar no rompe si falla el contador; usar fallback `0` o no mostrar badge.

Comandos de cierre:

- Backend: `npx tsc --noEmit` y tests CRM.
- Panel: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

Criterio para avanzar:

- El contador refleja `assigned_to = current_user and tomado_at is null`, no `estado=nueva`.

## Fase 7. Verificacion end-to-end

Objetivo: probar el CRM completo como flujo real.

Escenarios:

- Web publica, propiedad de vendedor:
  - enviar consulta
  - verificar asignacion al vendedor
  - verificar `tomado_at=null`
  - tomar desde panel
- Web publica, propiedad de admin:
  - enviar consulta
  - verificar asignacion al admin
  - tomar desde panel
- Web publica sin propiedad:
  - enviar varias consultas
  - verificar reparto entre vendedores activos
  - verificar contador sidebar
- WhatsApp/agente:
  - abrir conversacion
  - derivar a humano
  - tomar chat
  - verificar lead tomado
- Permisos:
  - vendedor no ve/toma lead ajeno
  - admin ve todos los leads del tenant
  - otro tenant queda aislado

Comandos finales por repo:

- `back-lamelas`: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test`
- `lamelas`: `npm run lint`, `npx tsc --noEmit`, `npm run build`
- `lamelas-web`: `npm run build`

## Orden de merge sugerido

1. `lamelas-web`: fix de `property_id` en ficha publica, porque es chico y desbloquea asignacion correcta con propiedad.
2. `back-lamelas` fases 1 y 2: modelo y endpoint de toma.
3. `back-lamelas` fase 3: asignacion web sin propiedad.
4. `back-lamelas` fase 4: WhatsApp integrado con toma de lead.
5. `lamelas` fase 5: UI de toma y distintivos.
6. `back-lamelas` + `lamelas` fase 6: contador de sidebar.
7. Verificacion end-to-end y deploy coordinado.

## No incluido en este plan

- Pipeline comercial avanzado.
- Automatizaciones de seguimiento.
- Mensajeria saliente desde el CRM.
- Cambios de roles o permisos generales.
- Reasignacion automatica por SLA para leads web.

Estos puntos pueden planificarse despues de estabilizar la base del CRM.
