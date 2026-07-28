import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";

/**
 * Puerta de las pantallas de administración. Todo lo que cuelgue de `(admin)/`
 * queda protegido por estar en la carpeta, sin que haya que acordarse de
 * escribir el chequeo en cada página nueva.
 *
 * `getCurrentUser` está envuelto en `cache()` y el layout de `(app)` ya lo
 * llamó en este mismo render, así que esto no agrega un request a la API.
 *
 * Los paréntesis del nombre no aparecen en la URL: las rutas siguen siendo
 * /equipo y /configuracion.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me || !esAdmin(me.rol)) redirect("/");

  return <>{children}</>;
}
