import type { Rol } from "@/lib/types";

/**
 * Quién es "admin" a los ojos del panel. Está acá y no repartido por las
 * pantallas para que el criterio sea uno solo: si mañana aparece un cuarto rol,
 * se cambia en este archivo y no hay que salir a buscar comparaciones sueltas.
 *
 * Esto NO es la autorización: la autorización vive en la API (RLS + requireRole
 * por ruta). Acá decidimos qué mostrar y a dónde redirigir.
 */
export function esAdmin(rol: Rol) {
  return rol === "admin" || rol === "super_admin";
}
