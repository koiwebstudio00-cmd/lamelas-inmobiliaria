# PRD — MVP: Registro de vendedores y propiedades

**Producto:** Sistema interno Inmobiliaria Lamelas · **Cliente:** Koi Studio · **Fecha:** Julio 2026 · **Versión:** 1.0

## 1. Resumen

MVP interno para que los vendedores de la inmobiliaria se registren y carguen propiedades. Sin sitio público, sin aprobaciones, sin multi-tenancy: solo cuentas y un registro de propiedades con fotos. Es la base sobre la que luego se construye la plataforma completa descripta en `planificacion-sistema-inmobiliario.md`.

## 2. Objetivo

Que en la primera semana de uso todos los vendedores tengan cuenta y el inventario de propiedades esté digitalizado en un solo lugar.

**Métrica de éxito:** 100% de los vendedores registrados y ≥ 80% del inventario actual cargado dentro de las 2 semanas del lanzamiento.

## 3. Alcance

### Incluido
- Registro y login de vendedores (email + contraseña), sin aprobación previa.
- CRUD de propiedades: cada vendedor crea, edita y elimina las suyas.
- Carga de fotos por propiedad.
- Listado interno de todas las propiedades (visible para todos los usuarios logueados).

### Excluido (post-MVP)
- Sitio web público y publicación de propiedades.
- Multi-tenancy (otras inmobiliarias).
- Flujo de aprobación admin → propiedad.
- Roles admin / super admin, gestión de equipo.
- Leads/consultas, notificaciones por email, dashboards, mapas, facturación.

## 4. Usuarios

| Usuario | Necesidad |
|---|---|
| **Vendedor** | Crear su cuenta en minutos y cargar propiedades con fotos desde cualquier dispositivo. |

Un solo rol en el MVP. Todos los usuarios registrados tienen los mismos permisos.

## 5. Requerimientos funcionales

### RF-1 Autenticación
- RF-1.1 Registro con nombre, email y contraseña. Sin verificación de email en MVP (opcional post-MVP).
- RF-1.2 Login / logout con sesión persistente.
- RF-1.3 Recuperación de contraseña por email.

### RF-2 Propiedades
- RF-2.1 Alta de propiedad con campos:
  - Título, descripción
  - Tipo de operación: venta / alquiler
  - Tipo de propiedad: casa / departamento / terreno / local / otro
  - Precio y moneda (ARS / USD)
  - Dirección, barrio/zona, ciudad
  - Ambientes, dormitorios, baños, superficie (m² cubiertos / totales)
  - Estado: disponible / reservada / vendida
  - Notas: campo de texto libre para información extra (interna)
- RF-2.2 Solo título, tipo de operación, tipo de propiedad y precio son obligatorios (carga rápida; el resto se completa después).
- RF-2.3 Edición y eliminación: solo el vendedor que la creó.
- RF-2.4 Carga de fotos (hasta 20 por propiedad, JPG/PNG/WebP, redimensionadas server-side), con foto de portada.

### RF-3 Listado
- RF-3.1 Listado de todas las propiedades con foto de portada, título, precio, estado y vendedor.
- RF-3.2 Filtros: tipo de operación, tipo de propiedad, estado, vendedor. Búsqueda por título/dirección.
- RF-3.3 Vista detalle con todos los campos y galería de fotos.
- RF-3.4 Vista "Mis propiedades" para cada vendedor.

## 6. Requerimientos no funcionales

- **Responsive:** los vendedores cargan desde el celular; el formulario y la subida de fotos deben funcionar bien en móvil.
- **Rendimiento:** listado < 2 s; fotos optimizadas (Next Image).
- **Seguridad:** contraseñas hasheadas, sesiones seguras, acceso solo autenticado.
- **Datos:** el modelo debe nacer preparado para multi-tenancy (`tenant_id` en tablas desde el día 1, aunque haya un solo tenant).

## 7. Modelo de datos

```
tenants (1 registro fijo: Lamelas)
  └── users (id, tenant_id, nombre, email, password_hash, created_at)
        └── properties (id, tenant_id, user_id, titulo, descripcion, operacion,
                        tipo, precio, moneda, direccion, zona, ciudad, ambientes,
                        dormitorios, banios, sup_cubierta, sup_total, estado,
                        notas, created_at, updated_at)
              └── property_images (id, property_id, url, es_portada, orden)
```

## 8. Stack

Next.js 15 (App Router, TS) + **Supabase** como backend completo: Postgres (base de datos), Supabase Auth (registro/login/recuperación de contraseña) y Supabase Storage (fotos). Hosting en Vercel. Reduce integraciones y acelera el MVP.

## 9. Flujo principal

1. Vendedor entra a la app → se registra → queda logueado.
2. "Nueva propiedad" → completa campos obligatorios → guarda.
3. Sube fotos y elige portada.
4. Ve la propiedad en el listado general y en "Mis propiedades".
5. Actualiza el estado cuando se reserva o vende.

## 10. Plan de entrega

| Semana | Entregable |
|---|---|
| 1 | Setup, modelo de datos, registro/login |
| 2 | CRUD propiedades + carga de fotos |
| 3 | Listado, filtros, detalle, pulido responsive, deploy |

**Total: ~3 semanas** (1 dev full-time).

## 11. Riesgos y decisiones abiertas

- Registro abierto sin aprobación: cualquiera con el link puede crear cuenta. Mitigación simple si hace falta: restringir por dominio de email o código de invitación.
- Definir moneda por defecto y si el precio puede quedar "a consultar".
- Confirmar lista de zonas/barrios (texto libre vs. lista cerrada).

## 12. Post-MVP inmediato

Rol admin y gestión de equipo → flujo de aprobación → sitio público (fases 3–5 de la planificación).
