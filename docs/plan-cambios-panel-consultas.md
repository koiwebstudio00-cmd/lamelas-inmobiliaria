# Plan de cambios — Panel de Consultas (`/consultas`)

Fecha: 2026-08-03 · Estado: **IMPLEMENTADO** (2026-08-03). Decisiones: sin teléfono en la edición · borrado solo admin · columna renombrada a "Consultó por". Falta: test de integración del `DELETE` y deploy del backend.

Seis pedidos sobre el listado y el detalle de consultas. Este doc verifica cada uno contra el backend (`back-lamelas`) y define el alcance. Al final, el orden de implementación sugerido.

Leyenda de alcance: **[Panel]** solo `lamelas` · **[Backend]** requiere tocar `back-lamelas` (migración/endpoint) · **[Doc]** solo explicación.

---

## 0. ¿Qué indica la columna "Propiedad"? · [Doc]

Es **la propiedad por la que consultó el lead**. Sale de `lead.property_id`: cuando alguien completa el formulario de contacto **desde la ficha de una propiedad** en el sitio público, el lead queda vinculado a esa propiedad y la columna muestra su título. Los leads que entran sin propiedad puntual (WhatsApp, hero del sitio, carga manual) muestran `—`.

No es un bug ni falta nada: los leads de WhatsApp y los del buscador general no nacen atados a una propiedad. **No requiere cambios** (salvo que quieras renombrar la columna a "Consultó por" para que sea más claro — opcional).

---

## 1. Editar datos básicos del lead (nombre / email / teléfono) · [Backend] + [Panel]

**Backend (necesario):** hoy `PATCH /v1/leads/:id` solo valida `estado` y `assigned_to` (`crm/routes.ts` L106). Hay que:

- Extender el schema Zod del `PATCH` para aceptar `nombre` (string 1–200), `email` (email o null) y `telefono` (string ≤50 o null), todos opcionales.
- Ajustar `crm.updateLead` (`crm/service.ts` L200) para pasar esos campos al `update`.
- RLS: es row-level, no column-level, así que la policy de update existente ya cubre editar estas columnas. Igual, según regla 1 del repo conviene un **test de integración** que confirme que un vendedor puede editar su lead y no el ajeno.
- Emitir `lead.updated` (ya lo hace) para que el webhook al sitio, si aplica, se entere.

**Panel:** en el sidebar "Datos del lead", hacer editables `nombre`, `email` y `telefono`. Opción recomendada: un botón "Editar" que abre un formulario inline (o un `Dialog` de shadcn) con esos tres campos; guardar con una server action nueva en `actions/leads.ts` (`updateLeadDatos`) validada con Zod. Revalida `/consultas/[id]`.

**Archivos:** `back-lamelas/src/modules/crm/{routes,service}.ts` (+ test); `lamelas/src/actions/leads.ts`, un componente nuevo `components/leads/lead-editar-datos.tsx`, y el `page.tsx`.

---

## 2. Botón "Abrir WhatsApp" cuando el lead entró por WhatsApp · [Panel]

**Panel solo.** En "Datos del lead", si `canal === "whatsapp"` y hay `telefono`, mostrar un botón que abra `https://wa.me/<telefono>` (limpiando todo lo que no sea dígito) en una pestaña nueva.

**Ojo con el formato:** Kapso guarda el número como `543815773949` (sin el `9` de celular argentino). `wa.me` para celulares de Argentina suele necesitar el `9`: `5493815773949`. Propuesta: una función `waLink(telefono)` que, si el número es argentino (`54…`) y no tiene el `9` después del `54`, lo inserte. Lo dejamos parametrizado y lo verificamos con el número real en la prueba.

**Archivos:** `lamelas/src/lib/utils.ts` (helper `waLink`), `page.tsx` (o el futuro `lead-editar-datos.tsx`).

---

## 3. Íconos de origen (web / WhatsApp / etc.) · [Panel]

**Panel solo.** Hoy `CanalBadge` (`components/leads/estado-badge.tsx`) muestra solo texto. Agregarle un ícono de `lucide-react` por canal:

- `web` → `Globe`
- `whatsapp` → `MessageCircle` (o el ícono de WhatsApp compuesto; lucide no trae el logo oficial, se usa uno genérico de mensaje)
- `instagram` → `Instagram`
- `messenger` → `MessageSquare`
- `manual` → `PhoneCall` / `UserPlus`

Aplica automáticamente en el listado (`Tabla` y `Cards`) y en el detalle, porque todos usan el mismo `CanalBadge`. Respetar la regla del proyecto: **solo `lucide-react`**, sin otras librerías de íconos.

**Archivos:** `lamelas/src/components/leads/estado-badge.tsx`.

---

## 4. Eliminar un lead · [Backend] + [Panel]

**Backend (necesario):** no existe `DELETE /v1/leads/:id`. Hay que:

- Nueva ruta `crmRoutes.delete("/leads/:id", …)`. **Solo admin** (`requireRole("admin")` o check en el service), porque es destructivo.
- `crm.deleteLead(auth, id)` con `tx.lead.deleteMany({ where: { id } })` dentro del tenant-context.
- **Migración con policy RLS de DELETE** sobre `leads` (hoy no hay → RLS deniega por defecto). La policy: un admin puede borrar leads de su tenant. Regla 1 del repo: **cambio de acceso = policy en migración + test de integración** (probar que admin borra, vendedor no, y aislamiento entre tenants).
- **Cascada:** ya resuelta por el esquema — `LeadNote`, `Conversation` (y por ella `ConversationMessage` y `Handoff`) tienen `onDelete: Cascade` hacia `Lead`. Borrar el lead limpia notas, conversación, mensajes y handoffs. No hay que borrar hijos a mano. (Verificar en el test que el cascade no choque con RLS de las tablas hijas; las acciones de FK en Postgres no pasan por RLS, así que debería estar OK.)

**Panel:** botón "Eliminar" (rojo, `variant="destructive"`) en el detalle, visible **solo para admin**, con confirmación (`AlertDialog` de shadcn — verificar si ya está el componente; si no, componerlo o usar un confirm simple sin sumar dependencias). Server action `deleteLead` → al borrar, `redirect("/consultas")`.

**Archivos:** `back-lamelas/src/modules/crm/{routes,service}.ts`, nueva migración `…_leads_delete_policy`, test de integración; `lamelas/src/actions/leads.ts`, `page.tsx`, componente de confirmación.

---

## 5. "Resumen del agente" en su propia card, separado de Notas internas · [Panel]

**Aclaración:** hoy hay dos cosas distintas y por eso se ve mezclado:

1. La card **"Resumen del agente"** que ya existe, con el **perfil** estructurado (Intención, Temperatura…). Esa ya está separada.
2. El **brief renderizado** del agente (el texto "🤖 Resumen del agente — dd/mm …") que el backend guarda como **una nota del lead con `origen = "agente"`**. Esa nota aparece hoy dentro de **"Notas internas"**, mezclada con las notas que escribe el equipo.

**Lo que se hace (panel solo):** separar las notas por `origen`. El `origen` ya viaja en la API (`GET /leads/:id` devuelve cada nota con su campo `origen`), solo falta mapearlo y usarlo:

- En `lib/queries.ts` (`getLead`): agregar `origen` al mapeo de notas.
- La card **"Resumen del agente"** pasa a mostrar el perfil **y** el último brief del agente (nota con `origen === "agente"`).
- **"Notas internas"** muestra **solo** las notas humanas (`origen === "humano"`), que es lo que el equipo escribe.

Así el resumen del agente queda destacado en su card y las notas internas quedan limpias.

**Archivos:** `lamelas/src/lib/{queries,types}.ts` (campo `origen` en `LeadNota`), `components/leads/lead-perfil.tsx` (o un componente nuevo para el brief), `page.tsx`, y `lead-notes.tsx` (filtrar humanas).

---

## Resumen de impacto

| # | Cambio | Backend | Panel | Migración/RLS |
|---|--------|:---:|:---:|:---:|
| 0 | Explicar columna Propiedad | — | — | — |
| 1 | Editar nombre/email/teléfono | ✅ | ✅ | test |
| 2 | Botón WhatsApp | — | ✅ | — |
| 3 | Íconos de origen | — | ✅ | — |
| 4 | Eliminar lead | ✅ | ✅ | **✅ policy DELETE + test** |
| 5 | Resumen del agente en card propia | — | ✅ | — |

## Orden sugerido de implementación

1. **Solo-panel primero** (rápido, sin deploy de backend): #3 íconos, #2 botón WhatsApp, #5 resumen en card propia.
2. **Backend + panel:** #1 editar datos (bajo riesgo).
3. **Backend + panel + migración:** #4 eliminar lead (el más delicado: policy RLS + test + acción destructiva). Va último.

## Decisiones a confirmar antes de implementar

- **#1:** ¿editar también `teléfono`, o solo nombre y email? (recomiendo incluir teléfono).
- **#4:** ¿el borrado es **solo admin** (recomendado) o también el vendedor dueño del lead?
- **#0:** ¿renombramos la columna "Propiedad" → "Consultó por"? (opcional).
