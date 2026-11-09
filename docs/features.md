# Features por implementar — lamelas (panel interno)

**Última revisión:** 2026-11-09 (limpieza: se sacaron las features ya en `main`; los pendientes se verificaron contra el código)

Backlog exclusivo de **este repo**. Cuando una feature se implementa y queda
verificada, se saca de acá; el historial vive en commits y en `docs/bugfix/`.

Las features que también necesitan trabajo en otro repo se registran allá con el
mismo ID: `back-lamelas/docs/features.md` (API y datos),
`lamelas-web/docs/features.md` (sitio público),
`lamelas-agent/docs/features.md` (Martina y n8n).

Formato de cada item: **qué es**, **ventaja** de hacerlo, **viabilidad**
(esfuerzo S/M/L y qué se toca) y **estado**.

## Orden de trabajo

Del orden acordado el 2026-09-27 ya están hechos zonas (`ZONA-SELECT-01`) y la
UI de Consultas (`CONSULTAS-UI-01`); quedan `LEAD-DATOS-01` y, en
`lamelas-web`, `OG-DINAMICO-01`.

Prioridad actual (2026-11-09): `TEMA-UI-01`, `MOBILE-UI-01`, `FOTOS-ORDEN-01` y
`TEMA-OSCURO-01` ya están mergeados a `main` (falta push y verificar en
producción); sigue `PROP-IA-TEXTO-01` y después `PORTADA-MEJORA-01`.

Flujo: todo se implementa en `dev`, Cacho prueba a mano y verifica, y solo
después se pasa a `main` y se sube al remoto.

## Sacado del backlog (2026-11-09)

Verificado contra el código: ya están en `main` (desplegados). El detalle de
cada uno vive en los commits y en `docs/bugfix/`.

`ZONA-SELECT-01`, `PUNTO-REF-01`, `CIUDAD-SUGERIDA-01`, `ZONA-REVISAR-01`, `CONSULTAS-UI-01`, `NOTIF-INTERNAS-01`, `LEAD-CIERRE-01`, `EDIFICIOS-01`, `LEAD-AVANCES-01`, `F3-PANEL`, `F9-PANEL`, `FEEDBACK-CANAL-01`, `ANALITICAS-ORIGEN-01`, `ANUNCIO-ORIGEN-02`, `CHAT-WHATSAPP-01`, `CHAT-MEDIA-01`, `CAPTACION-01`, `PUSH-PWA-01`, `EQUIPO-PRUEBAS-01`.

`CSS-BORDES-01` quedó resuelto con `TEMA-UI-01`: la regla `* { border-color }`
pasó a `@layer base` y las clases de borde de color vuelven a aplicarse.

## Índice

| ID | Item | Esfuerzo | Estado |
|---|---|:---:|---|
| PROP-IA-TEXTO-01 | Mejorador de título y descripción con IA (parte del texto del vendedor) | M | decidido — por implementar (backend + panel) |
| PORTADA-MEJORA-01 | Mejorar la calidad de las fotos sin cambiar el contenido | S/M | decidido el alcance — falta elegir técnica |
| FOTOS-ORDEN-01 | Reordenar fotos arrastrándolas (flechas en el celular) | S | mergeado a `main` el 2026-11-09 — falta push y verificar en producción |
| TEMA-OSCURO-01 | Modo claro / oscuro / sistema (`next-themes`) | S/M | mergeado a `main` el 2026-11-09 — falta push y verificar en producción |
| TEMA-UI-01 | Tema de tweakcn + micro-interacciones | M | mergeado a `main` el 2026-11-09 — falta push y verificar en producción |
| MOBILE-UI-01 | Versión mobile: barra inferior, filtros plegables, áreas táctiles | M | mergeado a `main` el 2026-11-09 — falta push y verificar en producción |
| FILTROS-PRECIO-01 | Filtro por rango de precio (con moneda) | S | propuesto |
| FILTROS-PANEL-01 | Más filtros: orden, ambientes/baños, zona/ciudad | S/M | parcial — falta definir alcance |
| ZONA-SELECT-02 | Zona como lista en el filtro de Analíticas y filtro por zona en Propiedades | S | pendiente |
| MOTIVO-VISIBLE-01 | Motivo de derivación siempre visible y filtrable | S | parcial |
| LEAD-DATOS-01 | Datos extra del lead en la ficha | S/M | a definir |
| SIN-LEER-01 | Estado "sin leer" por consulta | M | pendiente — depende del backend |
| F1-PANEL | Analíticas: vista comparativa por vendedor | M | parcial — depende del backend |
| F4-PANEL | Ajustes de Martina: horario, fuera de horario, criterios, disponibilidad | M | parcial — depende del backend |
| F7-PANEL | Logs de correo y envío desde la consulta | M | pendiente — depende del backend |
| MAIL-FALLBACK-01 | Proveedor y cupo de correos en Configuración | S | pendiente — depende del backend |
| NOTIF-TIEMPO-REAL-01 | Campanita en tiempo real (SSE) | M | propuesto |
| AUTH-REFRESH-RACE-01 | Sesión que se cierra si dos pedidos renuevan a la vez | S | propuesto — depende del backend |

---

## PROP-IA-TEXTO-01 — mejorador de título y descripción con IA

**Qué es.** Botón "Mejorar con IA" en el form/ficha de propiedad que propone un
título y una descripción con estructura común, y una acción masiva solo admin
para pasar el catálogo existente.
- **Título: plantilla determinística, sin IA.** Se arma con los datos cargados,
  p. ej. *"Departamento 2 dorm. en alquiler – Barrio Norte, San Miguel de
  Tucumán"*. Sale siempre igual y no cuesta nada.
- **Descripción: IA.** Reordena el texto libre del vendedor en secciones fijas
  (ambientes, comodidades, ubicación, condiciones) y propone campos que están en
  el texto pero vacíos en la ficha (p. ej. dormitorios).
- La IA **nunca guarda directo**: el panel muestra antes/después y el vendedor
  acepta o edita; se guarda con el `PATCH` de siempre.

**Ventaja.** Catálogo homogéneo (listado, sitio y buscador de Martina), mejor
SEO en `lamelas-web` y menos trabajo de redacción para los vendedores.

**Viabilidad.** M (1–2 días). Panel: botón + diálogo de comparación + acción
masiva. Backend: endpoint de sugerencia (ver `back-lamelas` →
`PROP-IA-TEXTO-01`). Modelo propuesto: `gpt-5-mini` con la key de OpenAI que ya
usa el agente (alternativa: `gpt-4.1-mini`, el del agente), con salida JSON
estricta, razonamiento mínimo y 2–3 ejemplos reales de Lamelas en el prompt.
Costo estimado < US$0,002 por propiedad (precios de agregadores, confirmar en la
consola de OpenAI).

**Ojo SEO.** El beneficio en el sitio depende de `lamelas-web` →
`OG-DINAMICO-01`: hoy `seo.ts` setea los meta tags por JS, que WhatsApp/Facebook
no ejecutan y Google indexa con demora.

**Referencia en Cubiko** (`ubikka/backend/src/modules/properties/copy-draft.ts`,
botón "Sugerir título y descripción con IA" en `property-form.tsx`): endpoint
`POST /properties/copy-draft` con rate limit, entrada validada con Zod (datos de
la ficha), salida JSON `{ titulo, descripcion }`, el vendedor revisa antes de
guardar, y una tabla de uso (`propertyCopyUsage`: tenant, usuario, modelo,
tokens) para medir el costo por inmobiliaria. Diferencias con este plan:
Cubiko genera **también el título con IA** (acá se propuso plantilla fija) y no
tiene acción masiva. Se puede portar casi tal cual al backend de Lamelas.

**Necesita en producción:** `OPENAI_API_KEY` (y el modelo) como variables del
backend en Dokploy — hoy la key la usa solo n8n.

**Decisión de Cacho (2026-11-09): mejorador, no generador.** El vendedor
escribe primero su título y su descripción (aunque sean flojos) y la IA los
mejora a partir de eso y de los datos de la ficha. Sin texto del vendedor el
botón no se habilita: la IA no inventa el título de cero. Nunca guarda directo:
muestra la propuesta y el vendedor acepta, edita o descarta.

Diferencia con Cubiko: allá genera desde los datos de la ficha; acá el texto
del vendedor es la entrada principal y la ficha solo aporta datos para no
contradecirla ni inventar.

**Estado.** Decidido el 2026-11-09, por implementar (backend + panel). Queda
abierto: si va la acción masiva para el admin.

## PORTADA-MEJORA-01 — mejorar la calidad de las fotos

**Qué es.** Botón en el administrador de fotos para mejorar la portada: niveles
automáticos, un poco de brillo/sombras solo si la foto está oscura y enfoque
leve. Se guarda como foto nueva (la original se conserva) y el vendedor elige
cuál queda de portada después de ver el antes/después.

**Decisión propuesta: sin IA generativa.** Los modelos de edición (gpt-image,
Gemini 2.5 Flash Image ~US$0,04/imagen) redibujan la foto entera aunque se pida
un cambio mínimo: pueden alterar ventanas, humedad o muebles (riesgo de
publicidad engañosa) y devuelven a menor resolución que los 1600 px actuales.
El procesamiento clásico no inventa píxeles y cuesta cero.

**Viabilidad.** S/M. Se puede hacer client-side con el mismo canvas de
`src/lib/resize-image.ts`, sin librerías nuevas, y subir el resultado por el
flujo presign/confirm existente. Límite: trabaja sobre la copia ya reducida a
1600 px WebP, no sobre el original del celular. Sin cambios de backend salvo que
se quiera marcar la foto como "mejorada".

**Decisión de Cacho (2026-11-09): solo mejorar la calidad.** Pensado para las
fotos flojas que suben algunos vendedores. No puede cambiar nada del contenido
(objetos, paredes, cielo, encuadre): solo nitidez, ruido, exposición y, si hace
falta, resolución.

**Técnica a elegir:**
- *Procesamiento clásico* en el navegador (niveles, reducción de ruido,
  enfoque): costo cero, sin proveedor nuevo, no inventa píxeles. No recupera
  resolución en fotos muy chicas o muy comprimidas.
- *Super-resolución con IA* (tipo Real-ESRGAN, por un servicio externo como
  Replicate): sí recupera detalle en fotos chicas, a ~US$0,002–0,01 por foto,
  pero es un proveedor nuevo y puede "reconstruir" texturas finas.

**Estado.** Decidido el alcance el 2026-11-09; falta elegir la técnica.

## FOTOS-ORDEN-01 — reordenar fotos arrastrándolas

**Qué es.** En el administrador de fotos, cambiar el orden arrastrando cada
foto (escritorio) y con flechas ← → (celular, donde el arrastre nativo del
navegador no funciona). El orden se usa en la galería del panel y del sitio.

**Ventaja.** Hoy el orden lo define la subida; para cambiarlo hay que borrar y
volver a subir.

**Viabilidad.** S, **solo panel**: `back-lamelas` ya expone
`PATCH /v1/properties/:id/images/order` (`images.reorder`). Falta la action en
`src/actions/images.ts` y la UI en `photo-manager.tsx`. Referencia directa:
`ubikka/app-dashboard/src/components/properties/photo-manager.tsx` (arrastre
HTML5 + flechas, sin librerías nuevas, guarda el orden completo de una vez).

**Cómo quedó.** `actions/images.ts` → `reorderPhotos` y `photo-manager.tsx`:
arrastre HTML5 en escritorio (la foto destino se marca mientras arrastrás),
flechas ← → en cada foto para el celular, número de orden visible, y orden
optimista (se mueve al instante y vuelve atrás si la API falla). Sin librerías
nuevas.

**Estado.** Mergeado a `main` el 2026-11-09; falta push y verificar en
producción.

## TEMA-OSCURO-01 — modo claro / oscuro / sistema

**Qué es.** Botón en la barra superior (o en el menú de la cuenta) para elegir
claro, oscuro o el del sistema; la preferencia queda en el navegador.

**Ventaja.** Uso cómodo de noche y en el celular; el tema de `TEMA-UI-01` ya
trae la paleta oscura.

**Viabilidad.** S/M.
- La paleta `.dark` ya está en `globals.css`; falta el selector y aplicar la
  clase `dark` sin parpadeo al cargar.
- Cubiko lo resuelve con `next-themes` (`theme-provider.tsx` +
  `nav/theme-switcher.tsx`). Es una **dependencia nueva**: alternativa sin
  dependencias = cookie + script inline en `layout.tsx`.
- Lo que más trabajo da: repasar colores fijos que no siguen el tema (badges de
  estado en hex, avisos `bg-amber-50`, gráficos de analíticas, botones de
  WhatsApp, impresión del reporte que debe salir siempre clara).

**Cómo quedó (decisión de Cacho: `next-themes`).**
- `components/theme-provider.tsx` en `app/layout.tsx` (arranca en claro;
  guarda la elección en `localStorage` como `lamelas-panel-tema`).
- Botón sol/luna en la barra superior (`components/nav/selector-tema.tsx`):
  Claro, Oscuro o Como el sistema.
- `globals.css`: la paleta `.dark` va dentro de `@media screen` (el reporte
  impreso sale siempre claro), `color-scheme: dark`, badges de estado en
  versión oscura, y los tonos fijos de Tailwind de los avisos suaves
  (`-50/-100/-200` y `-700/-900`) se redefinen en oscuro para no agregar
  `dark:` en cada componente.
- Toasts y color de la barra del navegador siguen el tema.

**Estado.** Mergeado a `main` el 2026-11-09; falta push y verificar en
producción. Requiere `npm install` (dependencia nueva `next-themes`).

## TEMA-UI-01 — tema nuevo y micro-interacciones

**Qué es.** Pedido de Cacho (2026-11-07): reemplazar el tema por el de tweakcn
`cmnl3tsn3000204l3ff39foko` y que la UI se sienta más suave y moderna.

**Cómo.**
- `src/app/globals.css`: tokens del tema (claro y `.dark`, sin selector todavía),
  radios 0.5rem en lugar de los bordes rectos, sombras del tema. Se conservan
  los tokens propios (warning, info, badges de estado de propiedad y consulta).
  Las saturaciones > 100% que exporta tweakcn se normalizaron a 100%.
- `tw-animate-css` estaba instalado pero no se importaba: diálogos, menús,
  tooltips y el cajón aparecían de golpe. Ahora se importa.
- Micro-interacciones en `globals.css` (capa `components`, sobre los
  `data-slot` de shadcn, sin editar `components/ui/`): botón que se hunde al
  presionar, sombra de color en hover, transiciones con curva suave (200 ms),
  clase `tarjeta-interactiva`, entrada de cada pantalla
  (`src/app/(app)/template.tsx`). Todo respeta `prefers-reduced-motion`.
- Paneles, avisos y estados vacíos redondeados en todas las pantallas.
- JetBrains Mono por `next/font`; `themeColor` del navegador y del manifiesto
  en `#00857A`.

**Pendiente de decidir.** El logo y los íconos de la app siguen en el verde
original. `lamelas-web` mantiene su identidad (no se tocó).

**Estado.** Mergeado a `main` el 2026-11-09; falta push y verificar en
producción.

## MOBILE-UI-01 — versión mobile más simple de navegar

**Qué es.** Pedido de Cacho (2026-11-07): que el panel sea más amigable en el
celular.

**Cómo.**
- **Barra inferior** (`components/nav/barra-inferior.tsx`, < md): Inicio,
  Propiedades, "+" (panel con Nueva propiedad / consulta / captación),
  Consultas con el contador de sin tomar, y Menú (abre el cajón). Se oculta en
  los formularios de alta y edición (`OCULTA_EN`). El encabezado muestra la
  marca en lugar de la hamburguesa.
- **Filtros** de Propiedades y Consultas con `components/filtros-plegables.tsx`:
  búsqueda a la vista, botón "Filtros" con la cantidad aplicada, panel inferior
  con selects grandes, "Limpiar" y "Ver resultados".
- **Toque:** en pantallas táctiles botones y campos de 44px y campos en 16px
  (iOS no hace zoom al enfocar).
- **Formularios:** el botón de guardar de propiedad queda fijo abajo (como en
  captaciones). `viewportFit: "cover"` + `env(safe-area-inset-bottom)` en todo
  lo fijo abajo.
- **Listados:** la vista Tabla/Cards funciona igual que en escritorio (decisión
  de Cacho, 2026-11-08: no forzar tarjetas); la tabla se desplaza hacia el
  costado. En Cards, la tarjeta de propiedad es horizontal (foto chica a la
  izquierda). Las etiquetas de la consulta bajan de línea y "Cargar consulta"
  se oculta (está en el "+").

**Estado.** Mergeado a `main` el 2026-11-09 (revisado en simulación de 390px
con datos locales); falta push y probar en un celular real.

## FILTROS-PRECIO-01 — rango de precio en el listado

**Qué es.** Campos "Precio desde / hasta" + moneda en `filters.tsx`, que viajan
como `precio_min`, `precio_max`, `moneda` en los query params.

**Ventaja.** Es la pregunta más habitual al buscar qué ofrecer a un cliente.

**Viabilidad.** S (medio día a un día con el backend, ver `back-lamelas` →
`FILTROS-PRECIO-01`). Dos detalles:
- **Moneda:** ARS y USD no se comparan sin tipo de cambio; el rango va siempre
  con una moneda (USD por defecto en venta, ARS en alquiler).
- **Operación "ambos":** usa `precio` si se filtra venta y `precio_alquiler` si
  se filtra alquiler.

**Estado.** Propuesto el 2026-11-04.

## FILTROS-PANEL-01 — mejoras generales de los filtros

**Qué es.** Hoy hay búsqueda, operación, dormitorios, tipo, estado, vendedor y
edificio. Propuesta:
- ordenar por precio y por fecha;
- ambientes y baños;
- zona (lista de `ZONAS`, ver `ZONA-SELECT-02`) y ciudad;
- chips con los filtros activos + "Limpiar";
- en el celular, los filtros dentro de un `Sheet` para que no ocupen media
  pantalla.

**Viabilidad.** S/M. Mayormente panel; orden y ambientes/baños necesitan
parámetros nuevos en la API (aditivos, no rompen `/v1`).

**Estado.** Propuesto el 2026-11-04. Falta que Cacho defina qué entra. El
punto del celular (filtros en un panel inferior, con contador de aplicados y
"Limpiar") ya salió con `MOBILE-UI-01` (`components/filtros-plegables.tsx`).

## ZONA-SELECT-02 — consecuencias de la lista cerrada en los filtros

**Qué es.** Dos lugares del panel quedaron desalineados con la lista cerrada:
- Analíticas → filtro "Zona exacta" es un `Input` de texto libre
  (`analytics-filters.tsx`) contra una comparación exacta en el backend. Debería
  ser el mismo `Select` de `ZONAS`.
- El listado de propiedades muestra la columna Zona pero **no se puede filtrar
  por zona**, aunque ahora el vocabulario es finito y el filtro sería trivial.

**Ventaja.** El filtro de analíticas deja de depender de que el admin escriba
exactamente igual que el vendedor que cargó la propiedad. Y filtrar el listado
por zona es la consulta más común de la oficina ("qué tengo en Yerba Buena").

**Viabilidad.** S. Solo panel; el endpoint de analíticas ya acepta `zona` y el de
propiedades ya acepta filtros.

**Estado.** Pendiente.

## MOTIVO-VISIBLE-01 — mostrar el motivo de derivación en el lead

**Qué es.** Pedido de los empleados: poder distinguir al lead que viene a **dejar
una propiedad**. Martina ya lo detecta y deriva con `motivo: "tasacion"`, que queda
guardado en `derivaciones.motivo`, pero el panel no lo muestra ni permite
filtrar por él.

**Ventaja.** Resuelve el pedido sin tocar el enum de clasificación ni migrar
nada: el dato ya existe. Los vendedores ven de una si la consulta es de alguien
que quiere comprar o de alguien que quiere vender.

**Viabilidad.** S del lado del panel (ficha del lead + filtro en Consultas), una
vez que la API lo devuelva → `back-lamelas/docs/features.md` →
`CLASIF-PROPIETARIO-01`.

**Estado.** Parcial (revisado 2026-11-09): el panel ya muestra el motivo
("Tasación / quiere vender", etc.) en el badge rojo, pero **solo mientras la
derivación está sin tomar**; después desaparece y no se puede filtrar por
motivo. Falta mostrarlo siempre en la ficha y el filtro en Consultas. Alternativa más cara: agregar `propietario` al enum de
clasificación, que además toca `actions/leads.ts`,
`lead-clasificacion-select.tsx`, `lead-filters.tsx`, `analytics-filters.tsx`,
`CLASIF_VALUES` y el tile de stats de Consultas.

## LEAD-DATOS-01 — datos extra del lead en la ficha

**Qué es.** Prioridad 3 del 2026-09-27: sumar datos del lead en la ficha. Todavía
sin definir cuáles.

**Ventaja.** Depende de qué se agregue; el criterio es que el vendedor no tenga
que abrir la conversación completa para saber con quién habla.

**Viabilidad.** S/M según si los datos ya están en la base (el resumen de Martina
guarda perfil: zonas, presupuesto, tipo, ciudad) o hay que capturarlos.

**Estado.** A definir.

## SIN-LEER-01 — estado "sin leer" por lead

**Qué es.** Distintivo visual de lead sin leer en: el listado, un badge en el
menú lateral, un filtro "Sin leer" y un tile del dashboard. Marcar como leída
**cierra el handoff**: el acuse de recibo del vendedor es lo que frena la
reasignación por timeout, igual que "Tomar el chat" en WhatsApp.

**Ventaja.** Le da a los leads web el mismo acuse de recibo que ya tienen los de
WhatsApp, que es lo que habilita reasignarlos cuando nadie los atiende. Y de paso
el vendedor ve de un vistazo qué le entró y no miró.

**Viabilidad.** M en el panel, pero depende de
`back-lamelas/docs/features.md` → `LEAD-WEB-HANDOFF-01` (L). Reglas ya
acordadas: `leido_at` se resetea al reasignar; se marca por acción explícita, no
por abrir el detalle; `POST /conversations/:id/take` también lo setea; el
distintivo cuelga de `assigned_to = yo`, nunca de ser dueño de la propiedad.

**Estado.** Pendiente. Plan completo del 2026-08-24 en
`Documents/Claude/Projects/Inmobiliaria lamelas/plan-reparto-leads-y-leidos.md`.

## F1-PANEL — vistas faltantes de analíticas

**Qué es.** Panorama, Consultas, Martina y Propiedades ya están (pestañas de
Analíticas + reporte mensual). **Falta la vista por vendedor**: hoy se puede
filtrar por vendedor, pero no hay una comparación entre vendedores (tomadas,
tiempo de respuesta, ganadas) en una sola tabla.

**Ventaja.** La vista de vendedores es la que permite hablar de tiempos de
respuesta con datos en vez de con impresiones.

**Viabilidad.** M, y va detrás de los endpoints
(`back-lamelas/docs/features.md` → `F1-API`). Diseño en
`lamelas-agent/docs/analytics-module.md`.

**Estado.** Parcial: falta solo la vista por vendedor (revisado 2026-11-09).

## F4-PANEL — pantalla de configuración de Martina por tenant

**Qué es.** Administración de bot activo/inactivo, horario y días de atención,
timeout de handoff, mensaje fuera de horario, criterios comerciales, URL del
sitio y disponibilidad de vendedores.

**Ventaja.** Cambiar un horario o el timeout de handoff deja de ser un deploy.

**Viabilidad.** M, detrás de `F4-API`. Ya existe `agent-settings-panel.tsx` como
punto de partida.

**Estado.** Parcial (revisado 2026-11-09): `/whatsapp/ajustes-agente`
(`agent-settings-panel.tsx`) ya tiene seguimiento de leads, comportamiento y
herramientas. Faltan horario y días de atención, mensaje fuera de horario,
criterios comerciales y disponibilidad de vendedores.

## F7-PANEL — logs de correo y envío desde el lead

**Qué es.** Vista de logs de entrega/rebote/error y envío de correo desde la
ficha del lead, con permisos y auditoría.

**Ventaja.** Cierra el circuito de "no me llegó el aviso" y deja la comunicación
con el cliente registrada en el CRM en vez de en el Gmail de cada vendedor.

**Viabilidad.** M, detrás de `F7-API`.

**Estado.** Pendiente.

## MAIL-FALLBACK-01 — proveedor y cupo en Configuración → Correos

**Qué es.** Parte de panel del respaldo Resend → Brevo (detalle en
`back-lamelas/docs/features.md` → `MAIL-FALLBACK-01`): mostrar por qué
proveedor salió cada correo y cuánto cupo de Resend queda en el día UTC y en
el mes. Opción de forzar Brevo en "Probar correo" de Equipo.

**Estado.** Pendiente, depende del backend.

## NOTIF-TIEMPO-REAL-01 — campanita en tiempo real

**Qué es.** La campanita consulta cada 60 segundos (`REFRESCO_MS` en
`components/notifications/notifications-bell.tsx`) con una Server Action. La
propuesta es que el navegador abra un stream SSE directo contra la API y que el
panel solo emita el ticket para conectarse; el sondeo queda como respaldo a
intervalo largo. Sería el primer caso en que el navegador habla con la API sin
pasar por el servidor de Next — la regla "el navegador nunca habla con la API"
pasa a tener esta excepción, de solo lectura.

**Ventaja.** Avisos al instante y menos consumo del plan Hobby de Vercel: cada
sondeo es una invocación de función. Con ~30 usuarios, 60 s son ~317.000
invocaciones por mes (el tope es 1.000.000); a 15 s serían ~1.270.000.

**Viabilidad.** M, detrás de `back-lamelas` → mismo ID. En el panel: una Server
Action que pide el ticket, un `EventSource` con reconexión, y refrescar también
el listado de Consultas cuando llega un aviso de consulta nueva.

**Estado.** Propuesto el 2026-10-05, sin implementar. Mientras tanto, mirar
Vercel → Usage a los 2–3 días del deploy.

## AUTH-REFRESH-RACE-01 — la sesión se cierra si dos requests renuevan a la vez

**Qué es.** `src/middleware.ts` renueva el access token vencido con el refresh,
que rota. Si dos requests llegan a la vez al vencer, el segundo usa un refresh ya
rotado, la API responde 401 y el usuario cae en `/login`. Pasa entre dos
requests cualesquiera (dos pestañas, una navegación y el sondeo de la campanita).
Reproducido en local forzando el caso: 1 de 5 intentos.

**Viabilidad.** El arreglo de fondo es del backend (ventana de gracia para el
refresh recién rotado): `back-lamelas/docs/features.md` → mismo ID. Del lado del
panel no hay nada que cambiar si se hace allá.

**Estado.** Propuesto el 2026-10-05.

