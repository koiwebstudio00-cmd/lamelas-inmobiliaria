# Lamelas — panel interno

Panel de gestión de Inmobiliaria Lamelas & Chaumont: los vendedores cargan y editan propiedades con fotos, y lo que publican aparece en el sitio público.

Es un cliente del backend propio **`back-lamelas`**: no tiene base de datos ni almacenamiento propios. El navegador nunca habla con la API — todas las llamadas salen del servidor de Next, que reenvía las cookies de sesión.

## Repos del proyecto

| Repo           | Qué es                                                 |
| -------------- | ------------------------------------------------------ |
| `back-lamelas` | API (Express + Prisma + Postgres), sesión, fotos en R2 |
| `lamelas`      | este panel interno (Next.js)                           |
| `lamelas-web`  | sitio público (Vite + React)                           |

## Arrancar

```bash
npm install
cp .env.example .env.local   # API_URL apuntando a back-lamelas
npm run dev                  # http://localhost:3000
```

Necesita `back-lamelas` corriendo (por defecto en `http://localhost:3001`).

Las cuentas se crean por invitación: un admin invita desde la API y la persona entra por `/aceptar-invitacion?token=`.

## Antes de dar algo por terminado

```bash
npm run lint && npx tsc --noEmit && npm run build
```

Para trabajar en el código, leer `CLAUDE.md` / `AGENTS.md`. Los documentos de `docs/` describen el MVP original sobre Supabase y se conservan como historia del producto.
