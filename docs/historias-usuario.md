# Historias de Usuario — MVP Registro de Propiedades

**Referencia:** `prd-mvp-registro-propiedades.md` · Rol único: **Vendedor**

Prioridad: P0 = imprescindible para lanzar · P1 = deseable en MVP

## Épica 1 — Autenticación

### HU-1 Registro (P0)
**Como** vendedor **quiero** crear mi cuenta con nombre, email y contraseña **para** empezar a cargar propiedades.

Criterios de aceptación:
- Dado el formulario completo con email válido y contraseña ≥ 8 caracteres, al enviar se crea la cuenta y quedo logueado en `/propiedades`.
- Si el email ya existe, veo un error claro sin perder lo tipeado.
- No se requiere verificación de email ni aprobación.
- Funciona correctamente en móvil.

### HU-2 Login / Logout (P0)
**Como** vendedor **quiero** iniciar y cerrar sesión **para** acceder de forma segura.

Criterios:
- Con credenciales válidas entro a `/propiedades`; con inválidas veo error genérico (sin revelar si el email existe).
- La sesión persiste al cerrar el browser.
- Logout disponible desde el menú; al salir, las rutas de la app redirigen a login.

### HU-3 Recuperar contraseña (P0)
**Como** vendedor **quiero** restablecer mi contraseña por email **para** recuperar el acceso.

Criterios:
- Ingreso mi email → recibo link de reseteo → defino nueva contraseña → puedo loguearme.
- El mensaje de confirmación es el mismo exista o no el email.

## Épica 2 — Propiedades

### HU-4 Alta rápida de propiedad (P0)
**Como** vendedor **quiero** cargar una propiedad con lo mínimo (título, operación, tipo, precio) **para** registrarla en menos de un minuto.

Criterios:
- Solo título, operación (venta/alquiler), tipo y precio son obligatorios; moneda default ARS.
- Al guardar, la propiedad queda en estado `disponible` y me lleva a la carga de fotos (puedo saltearla).
- Los errores de validación se muestran por campo.
- El formulario es usable en móvil.

### HU-5 Completar datos de propiedad (P0)
**Como** vendedor **quiero** editar mi propiedad para completar descripción, dirección, zona, ciudad, ambientes, dormitorios, baños, superficies, estado y notas **para** tener la ficha completa.

Criterios:
- Solo puedo editar propiedades creadas por mí (intento ajeno → error/oculto).
- El campo notas acepta texto libre y es visible en el detalle para todos los usuarios.
- Los cambios se reflejan de inmediato en listado y detalle.

### HU-6 Subir fotos (P0)
**Como** vendedor **quiero** subir fotos y elegir una portada **para** que la propiedad sea identificable.

Criterios:
- Hasta 20 fotos por propiedad; JPG/PNG/WebP; se redimensionan antes de subir (máx. 1920px).
- Puedo marcar una (y solo una) como portada; la primera subida es portada por defecto.
- Puedo eliminar fotos y reordenarlas (P1 el reordenado).
- Subida desde la galería o cámara del celular.

### HU-7 Cambiar estado (P0)
**Como** vendedor **quiero** marcar mi propiedad como disponible / reservada / vendida **para** reflejar la realidad comercial.

Criterios:
- Cambio de estado en un clic desde detalle o "Mis propiedades".
- El estado se ve con badge de color en listados.

### HU-8 Eliminar propiedad (P0)
**Como** vendedor **quiero** eliminar una propiedad mía **para** sacar registros erróneos o duplicados.

Criterios:
- Confirmación previa ("¿Eliminar X?").
- Se eliminan también sus fotos (BD y Storage).
- Solo el creador puede eliminar.

## Épica 3 — Listado y consulta

### HU-9 Listado general (P0)
**Como** vendedor **quiero** ver todas las propiedades de la inmobiliaria **para** conocer el inventario completo.

Criterios:
- Cards con portada, título, precio+moneda, estado y nombre del vendedor.
- Orden por fecha de creación descendente; paginado de 24.
- Carga en < 2 s.

### HU-10 Filtros y búsqueda (P0)
**Como** vendedor **quiero** filtrar por operación, tipo, estado y vendedor, y buscar por título/dirección **para** encontrar propiedades rápido.

Criterios:
- Los filtros se combinan entre sí y con la búsqueda.
- Los filtros viven en la URL (compartible, sobrevive refresh).
- "Sin resultados" tiene estado vacío claro con acción de limpiar filtros.

### HU-11 Detalle de propiedad (P0)
**Como** vendedor **quiero** ver la ficha completa con galería **para** consultar todos los datos.

Criterios:
- Muestra todos los campos cargados (los vacíos no se muestran) + notas + vendedor + fechas.
- Galería navegable; portada primero.

### HU-12 Mis propiedades (P0)
**Como** vendedor **quiero** una vista con solo mis propiedades **para** gestionar mi cartera.

Criterios:
- Misma card que el listado + accesos rápidos a editar y cambiar estado.
- Contador por estado (ej: 12 disponibles · 3 reservadas · 5 vendidas) (P1).

## Resumen

| # | Historia | Prioridad | Épica |
|---|---|---|---|
| HU-1 | Registro | P0 | Auth |
| HU-2 | Login/Logout | P0 | Auth |
| HU-3 | Recuperar contraseña | P0 | Auth |
| HU-4 | Alta rápida | P0 | Propiedades |
| HU-5 | Edición completa | P0 | Propiedades |
| HU-6 | Fotos | P0 | Propiedades |
| HU-7 | Cambiar estado | P0 | Propiedades |
| HU-8 | Eliminar | P0 | Propiedades |
| HU-9 | Listado general | P0 | Listado |
| HU-10 | Filtros y búsqueda | P0 | Listado |
| HU-11 | Detalle | P0 | Listado |
| HU-12 | Mis propiedades | P0 | Listado |
