# Plan de implementación — Formulario único de propiedades (FORM-UNICO-01)

Fecha: 2026-11-23. Estado: **plan aprobado por Cacho, sin implementar.**
Ficha de la feature y decisiones: `docs/features.md` → FORM-UNICO-01.

Repos: `back-lamelas` (API), `lamelas` (panel), `lamelas-web` (sitio), `lamelas-agent` (Martina).
Flujo: todo en `dev`. Cacho prueba a mano. Recién después pasa a `main` y se despliega.
Migraciones: siempre con `prisma migrate dev --create-only` y revisión del SQL (regla 4 del backend).

---

## Objetivo

Un solo formulario para cargar propiedades: el de **Nueva propiedad**, completado con los
campos de la captación. Si la propiedad está completa se publica; si no, queda en borrador.
El mensaje para el grupo de WhatsApp se puede copiar en cualquier momento desde la edición.
Al terminar, el formulario de captación se oculta.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Base | Formulario de Nueva propiedad + campos de captación |
| Obligatorios para publicar | Los de captación, con sus reglas por tipo |
| Obligatorios para borrador | Título, operación, tipo y precio |
| Estado nuevo | `borrador`. No lo ven Martina ni el sitio |
| Botones | **Publicar / Guardar cambios** y **Guardar como borrador** |
| Editar una publicada incompleta | "Guardar cambios" se bloquea y muestra qué falta |
| Propiedades ya cargadas | Siguen publicadas. Badge "Faltan datos" si les falta algo |
| Tipos | Se suma Quinta / Country. Etiquetas: Galpón / Depósito, Estacionamiento / Cochera, Terreno / Lote |
| Monoambiente | Deja de ser tipo. Es Departamento con `dormitorios = 0` |
| Dormitorios | Select: Monoambiente (0), 1, 2, 3, 4 o más |
| Unidad | Sin cambios (edificio o "-", con unidad habilitada) |
| Localidad / barrio | Son `ciudad` / `zona`. Obligatorios para publicar. Listas actuales hasta tener la de barrios por localidad |
| "No publicar, solo ofrecer" | Estado `privado` |
| Responsable | El admin puede cargar a nombre de otro vendedor |
| Datos sensibles | Tabla aparte, invisible para `agent`, `export` y `public` |
| Mensaje para el grupo | Se genera desde la propiedad. Venta: `*VENTA · TIPO*` sin contrato, depósito ni garantías. Ambas: los dos precios y las condiciones de alquiler |
| Captación | Se oculta del menú. Las existentes quedan como historial de solo lectura |

## Edición de propiedades publicadas (decidido 2026-11-23)

En una propiedad publicada, el guardado se bloquea solo si **vacía** un obligatorio que ya
tenía valor. Lo que ya faltaba (propiedades viejas) sigue marcado con el badge
"Faltan datos", pero no impide guardar. Así se puede cambiar el precio de una propiedad
vieja sin tener que completarla entera.

---

## Fase 1 — Base de datos (`back-lamelas`)

Cada punto es una migración nueva (no editar las aplicadas).

1. **Valores de enum nuevos.** Van en su propia migración: Postgres no deja usar un valor
   agregado con `ALTER TYPE … ADD VALUE` en la misma transacción.
   - `estado_enum`: `borrador`.
   - Tipo de propiedad: `quinta` (nombre a confirmar en la revisión del SQL).
   - `ajuste`: `semestral`, `anual`.
   - `indice_ajuste`: `casa_propia`.
   - `plazo_contrato`: `a_convenir`.
   - `amoblado`: `semiamoblado`.
   - `mascotas`: `a_convenir`.
2. **Columnas nuevas en `properties`** (todas opcionales en la base; la completitud la
   valida la API):
   - `cochera` (no tiene / 1 / 2 / 3 o más) y `cochera_cubierta` (boolean).
   - `ambientes_lista` (text[]: Cocina, Living, Toilet…). Se mantiene `ambientes` (número).
   - `medidas_lote` (text).
   - `comodidades` y `servicios` (text[]).
   - `acepta_ninos` (sí / no / a convenir).
   - `garantia` y `garantia_detalle`.
   - `deposito` y `deposito_detalle`.
   - `disponibilidad` y `disponible_desde` (date).
3. **Tabla `property_datos_internos`** (1 a 1 con `properties`):
   - Columnas: `llaves`, `visitas`, `pide_propietario` y lugar para datos del propietario.
   - RLS: lectura y escritura solo para `admin` y `agente` del tenant (el vendedor, con la
     misma regla de edición que la propiedad). **Sin policy** para `agent`, `export`,
     `public` ni `auth`.
   - Las observaciones siguen en `notas`, que ya está fuera del export y del agente.
4. **Migración de datos de monoambiente.** `tipo = monoambiente` → `departamento` con
   `dormitorios = 0`. Las que tengan dormitorios mayor que 0 no se tocan: se listan para
   revisión manual. El valor `monoambiente` queda en el enum (no se puede quitar sin
   recrear el tipo) pero deja de ofrecerse.
5. Regenerar el cliente de Prisma y actualizar `docs/diagrama-er.md`.

## Fase 2 — API (`back-lamelas`)

1. **Completitud (módulo nuevo, por ejemplo `properties/completitud.ts`):** recibe la
   propiedad y devuelve la lista de campos faltantes según las reglas por tipo (portar
   `aplica()` y `validarPaso()` de `lamelas/src/lib/captacion.ts`). Una sola fuente de
   verdad.
2. **Reglas en alta y edición:**
   - Con `estado = borrador` alcanza con los cuatro mínimos.
   - Pasar a cualquier otro estado exige completitud. Si falta algo: `422` con la lista
     de faltantes. Vale para **todos los caminos**, incluido el cambio de estado desde
     el detalle.
   - Editar una publicada: se bloquea (`422` con los campos) solo si el cambio vacía un
     obligatorio que ya tenía valor. Para eso la API compara los faltantes antes y
     después del cambio: si aparece uno nuevo, rechaza.
3. **Respuestas:** el detalle y el listado del panel suman `faltantes: string[]`.
4. **Datos internos:** endpoints propios o incluidos en el detalle del panel, nunca en
   `/v1/export` ni en el contexto `agent`.
5. **Export:** excluir `borrador` siempre, aunque no se pida filtro de estado.
6. **Martina solo trabaja con propiedades que puede mostrar (bug a corregir).**

   **Problema.** La búsqueda, los similares y las alternativas del agente ya filtran
   `disponible` y `privado` (`agent/repo.ts`). Pero `findPropertyByIdOrSlug`, que usa la
   herramienta `ver_propiedad`, **no filtra por estado a propósito**, para poder decir
   "esa ya se reservó". Con el estado `borrador`, si Martina recibe el id o el slug de una
   propiedad sin publicar (un link compartido, un anuncio viejo, una conversación anterior),
   la mostraría con todos sus datos. Lo mismo pasa hoy con las `pausado`.

   **Solución.**
   1. Una constante única en el backend con los estados que Martina puede **ofrecer**:
      `disponible` y `privado`. Todas las consultas del agente la usan, en lugar de repetir
      la lista en cada query como hoy.
   2. `ver_propiedad` responde según el estado:
      - `disponible` o `privado`: datos completos, como hoy.
      - `reservado`, `vendida`, `alquilada` o `proximamente`: solo `id`, `titulo` y
        `estado`, sin precio, dirección ni fotos. Alcanza para que diga "esa ya se
        reservó" y ofrezca alternativas.
      - `borrador` o `pausado`: se trata como no encontrada (misma respuesta que un id
        inexistente). Martina no puede saber que existe.
   3. Defensa en profundidad con RLS: la policy de lectura de `properties` para el
      contexto `agent` excluye `borrador`. Aunque una query futura se olvide el filtro, la
      base no la devuelve.
   4. Lo mismo para `identificar_propiedad` y cualquier herramienta que reciba un id, slug,
      dirección o link.
   5. Prompt (`system-prompt.md`): Martina solo ofrece propiedades que devolvieron sus
      herramientas como disponibles; si una no está disponible, lo dice y busca
      alternativas.
7. **Campos nuevos visibles para Martina y el sitio:** sumar al `select` del agente y del
   export las columnas nuevas no sensibles (cochera, ambientes, comodidades, servicios,
   niños, garantía, depósito, disponibilidad). Ninguna de la tabla interna.
8. **Responsable:** el admin puede mandar `user_id` en el alta y la edición. Un vendedor no.
9. **Monoambiente:**
   - `src/lib/search.ts`: "monoambiente" y "mono" → departamento con dormitorios 0.
   - `agent/property-search.ts` y `agent/repo.ts`: ajustar las equivalencias de tipo.
   - `analytics/routes.ts` y `analytics/repo.ts`: quitar el tipo de las listas.
   - Filtros de dormitorios: aceptar 0 (Monoambiente). "4" sigue siendo "4 o más".
10. **`property-opciones.ts`:** tipos, etiquetas y opciones nuevas.
11. **Tests:**
    - Completitud por tipo y transiciones de estado (borrador → disponible con y sin datos).
    - RLS de `property_datos_internos` con los ocho contextos.
    - Anti-fuga: `/v1/export`, `/v1/public` y el agente no devuelven datos internos.
    - El export no devuelve borradores.
    - Agente: `ver_propiedad` e `identificar_propiedad` con una propiedad en cada estado
      (completa, mínima o no encontrada, según la tabla del punto 6), y la RLS del
      contexto `agent` sin acceso a `borrador`.
    - Migración de monoambiente.
    - Alta a nombre de otro vendedor (admin sí, vendedor no).
12. Actualizar `docs/api-spec.md`. Los campos nuevos son aditivos: `/v1` no se rompe.

## Fase 3 — Panel (`lamelas`)

1. **Tipos y opciones** (`src/lib/types.ts`): tipos, etiquetas, Semiamoblado, A convenir,
   Semestral, Anual, Casa Propia, opciones de cochera, ambientes, comodidades, servicios,
   garantía, depósito, disponibilidad y llaves (tomar las listas de `src/lib/captacion.ts`).
2. **`queries.ts`:** adaptar los campos nuevos, `faltantes` y los datos internos.
3. **Formulario (`property-form.tsx`):**
   - Dormitorios como select (Monoambiente, 1, 2, 3, 4 o más). Sin tipo Monoambiente.
   - Características: cochera, ambientes en casillas, medidas del lote, comodidades,
     servicios, acepta niños.
   - Condiciones: ajuste unificado con la frecuencia, garantía, depósito, disponibilidad.
   - Sección nueva "Llaves y visitas": llaves, visitas, qué pide el propietario y
     publicación ("No publicar, solo ofrecer" → `privado`).
   - Responsable: select visible solo para admin.
   - Campos condicionales y obligatorios según el tipo (misma lógica que la API, solo para
     guiar; la API manda).
   - Botones: **Publicar / Guardar cambios** y **Guardar como borrador**. Si falta algo,
     listar los campos y llevar al primero.
   - Mobile-first: probar en el celular. Secciones plegables si el formulario queda largo.
4. **Badges:** "Borrador · faltan N datos" y "Faltan datos" (publicadas incompletas) en el
   listado y la ficha. Filtro "Borradores" en Propiedades.
5. **Mensaje para el grupo:** adaptar `armarMensaje` para que tome una propiedad.
   - Alquiler: igual que hoy.
   - Venta: `*VENTA · TIPO*`, precio y características, sin contrato, depósito ni garantías.
   - Ambas: los dos precios y las condiciones de alquiler.
   - Botón **Copiar mensaje** en la edición y en la ficha (con "Abrir WhatsApp" como hoy).
6. **Ocultar captación:** quitarla de `app-nav.tsx`, de la barra inferior y del botón "+".
   El listado y el detalle quedan de solo lectura. Sin borrar código ni datos.
7. Las acciones siguen por Server Actions con Zod (`src/lib/validations/`).

## Fase 4 — Sitio público (`lamelas-web`)

1. `src/types.ts`: quitar Monoambiente de los tipos, sumar Quinta / Country y las etiquetas
   nuevas.
2. Filtro de dormitorios: sumar Monoambiente (0).
3. Links viejos con `tipo=monoambiente`: traducir a departamento + dormitorios 0.
4. Ficha: mostrar los campos nuevos públicos (cochera, ambientes, comodidades, servicios,
   niños, garantía, depósito, disponibilidad), tolerando nulos.

## Fase 5 — Agente (`lamelas-agent`)

1. `agent-contract/tools.json` y `system-prompt.md`: monoambiente = departamento sin
   dormitorios; Quinta / Country; campos nuevos que puede usar para responder; regla de
   ofrecer solo propiedades disponibles y cómo responder ante una no disponible (fase 2,
   punto 6).
2. `resumen.schema.json` y `search-tools.test.mjs`: ajustar el tipo.
3. Aplicar en el workflow productivo de n8n según `docs/importar-en-n8n.md`.

## Fase 6 — Reglas del proyecto (CLAUDE.md)

- **`lamelas`, regla 5** y **`back-lamelas`, regla 9:** reemplazar "solo título, operación,
  tipo y precio" por: para guardar como borrador alcanza con título, operación, tipo y
  precio; para publicar se exigen los obligatorios de la captación según el tipo
  (`properties/completitud.ts`). La API es la que valida.
- **`back-lamelas`:** sumar que los datos internos (`property_datos_internos`) nunca salen
  por `/export`, `/public` ni el contexto `agent`, con su test anti-fuga.
- **`lamelas-web`, regla 4 y 5:** lista de tipos actualizada; el sitio sigue tolerando nulos.
- Quitar del CLAUDE.md del panel la fila de `/captaciones` como alta activa.

## Fase 7 — Verificación y deploy

1. En cada repo: `npm run lint && npx tsc --noEmit && npm run build` (y `npm test` en el
   backend, con la suite RLS y aislamiento entre dos tenants).
2. Cacho prueba en `dev`: alta completa, borrador, edición, badges, mensaje, celular.
3. Guía `back-lamelas/docs/deploy-tanda-AAAA-MM-DD.md`. Orden: migraciones y backend →
   panel → sitio → n8n.
4. Después del deploy: revisar la lista de monoambientes con dormitorios para corregir a mano.

## Fuera de este plan

- Lista de barrios por localidad (ZONA-SELECT-02): se usan las listas actuales.
- Pipeline kanban (PIPELINE-KANBAN-01).
- Pasar las captaciones existentes a propiedades.
