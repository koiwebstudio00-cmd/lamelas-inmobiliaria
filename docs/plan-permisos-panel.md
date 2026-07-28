# Plan — Vistas por rol en el panel

**Objetivo:** que el vendedor (`agente`) solo alcance Propiedades y Consultas, que Equipo y Configuración queden reservadas a `admin` y `super_admin`, y que Inicio muestre a cada uno lo que le corresponde. Sin tocar el backend.

**Punto de partida:** la autorización real ya está resuelta en la API (RLS por `SET LOCAL`, `requireRole` en las rutas de admin). Un vendedor que llame a `/v1/users` recibe 403 hoy mismo. Lo que falta es del lado del panel: que no le mostremos puertas que no puede abrir, y que la pantalla de Inicio no le informe números que no le tocan.

## Estado actual

| Superficie | Hoy |
| --- | --- |
| Navegación | `app-nav.tsx` filtra por `soloAdmin`. Correcto. |
| `/equipo`, `/configuracion` | Cada página repite `if (me.rol !== "admin" && me.rol !== "super_admin") redirect("/")`. Funciona, pero es un chequeo copiado que hay que acordarse de escribir en cada página nueva. |
| `/` (Inicio) | Idéntico para todos: totales de toda la inmobiliaria y últimas 5 consultas del tenant. Un vendedor ve el inventario y las consultas del equipo entero. |
| `/propiedades`, `/consultas`, `/mis-propiedades`, `/perfil` | Sin chequeo de rol, y está bien: son de todos. |
| Server Actions (`team.ts`, `api-keys.ts`) | Sin chequeo local. La API las rechaza con 403. |

## Dónde va el control — decisión

Revisé las tres opciones porque veníamos de hacerlo en el middleware:

**Middleware.** Es el lugar natural cuando el rol viaja en un JWT que el front puede leer. Acá tiene un problema concreto: el panel no tiene la clave con la que el backend firma el access token, así que el middleware tendría que decodificar el JWT **sin verificar la firma** para leer el rol. Para decidir un redirect es tolerable — la API sigue siendo el guardia real — pero significa meter parsing de tokens en una capa que hoy solo los reenvía, y tomar una decisión de autorización sobre un dato no verificado. Además el middleware corre en el runtime edge, donde no podés reusar `getCurrentUser()`.

**Helper `requireAdmin()` en cada página.** Es lo que ya hacés, ordenado. Sigue dependiendo de que alguien se acuerde de llamarlo.

**Layout de grupo de rutas — elegido.** Un `layout.tsx` en `(app)/(admin)/` que verifica una vez y protege todo lo que cuelgue de esa carpeta. Ventajas concretas acá: usa `getCurrentUser()`, que ya está envuelto en `cache()` de React y ya se llama en el layout de `(app)`, así que **no agrega ni un request**; el rol viene de la API, verificado, no de un token decodificado a mano; y una página nueva queda protegida por estar en la carpeta, sin línea que recordar.

El middleware no se toca: sigue haciendo lo suyo, que es renovar la sesión. Sesión en el middleware, autorización en el layout.

## Cambios

### 1. Grupo de rutas `(admin)`

```
src/app/(app)/
  (admin)/
    layout.tsx          ← nuevo: el único chequeo de rol
    equipo/page.tsx     ← movida, se le saca el redirect propio
    configuracion/page.tsx
```

El layout resuelve `getCurrentUser()`, y si el rol no es `admin` ni `super_admin` hace `redirect("/")`. Los grupos entre paréntesis no afectan la URL: `/equipo` y `/configuracion` siguen siendo las mismas rutas.

### 2. `src/lib/permisos.ts`

Un solo lugar que defina qué es ser admin, para que el criterio no quede repetido en el layout, la navegación y las páginas:

```ts
export function esAdmin(rol: Rol) {
  return rol === "admin" || rol === "super_admin";
}
```

`app-nav.tsx` y el layout nuevo pasan a usarlo. Si mañana aparece un cuarto rol, se cambia acá.

### 3. Inicio recortado para el vendedor

`getResumen()` pasa a recibir el usuario y ramifica:

| Bloque | Admin / super admin | Vendedor |
| --- | --- | --- |
| Contadores de propiedades | Totales del tenant (`/v1/properties`) | Solo las suyas (`/v1/properties/mine`) |
| Consultas nuevas | Todas las del tenant | Solo las asignadas a él (`assigned_to=<su id>`) |
| Últimas consultas | Últimas 5 del tenant | Últimas 5 asignadas a él |
| Últimas propiedades | Últimas 4 del tenant | Últimas 4 suyas |

No hace falta ningún endpoint nuevo: `/v1/properties/mine` acepta los mismos filtros que `/v1/properties`, así que los contadores por estado salen con el mismo truco que ya usás (`estado=X&limit=1` y leer `meta.total`). Y `/v1/leads` ya filtra por `assigned_to`.

Los textos también cambian: "Todo lo que tiene cargado la inmobiliaria" no es lo que está viendo un vendedor. Pasa a "Lo que cargaste vos" y "Tus consultas".

### 4. Defensa en profundidad en las Server Actions

`team.ts` y `api-keys.ts` reciben un chequeo de rol al principio. Es redundante con la API a propósito: una Server Action es un endpoint HTTP real, alcanzable con un POST armado a mano, y no quiero que la única barrera esté del otro lado de la red.

## Fuera de alcance

- **Filtrar el listado de Propiedades para el vendedor.** Hoy ve todo el inventario del tenant, y así debe ser: necesita el catálogo completo para vender. Si en algún momento querés que solo vea lo suyo, eso es un cambio de RLS en el backend, no del panel.
- **Ocultar el nombre del vendedor** en las tarjetas y tablas. Es información de equipo, no sensible.
- **Rol `super_admin` diferenciado.** Por ahora ve exactamente lo mismo que `admin`, tal como pediste. Cuando exista la pantalla de métricas y suspensión de tenants, va a necesitar su propio grupo `(super)`; el patrón de carpetas ya queda listo para eso.

## Verificación

1. `npx tsc --noEmit` y `npm run lint` en cero.
2. Con sesión de vendedor: `/equipo` y `/configuracion` redirigen a `/`; la navegación no las muestra; Inicio muestra solo números propios.
3. Con sesión de admin: las cuatro secciones accesibles y los totales del tenant sin cambios.
4. `curl` con la cookie de un vendedor contra la Server Action de invitaciones: rechazada por el panel, sin llegar a la API.

## Riesgo

El único movimiento delicado es mudar dos carpetas de página. Las URLs no cambian (los grupos entre paréntesis no aparecen en la ruta), pero conviene hacer el `git commit` antes de mover, para que el `git mv` quede legible en el historial.
