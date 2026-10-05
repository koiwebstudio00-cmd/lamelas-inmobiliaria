"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";
import { getResumenNotificaciones, type ResumenNotificaciones } from "@/lib/queries";

/**
 * Notificaciones internas (campanita).
 *
 * Cada usuario solo ve y marca las suyas: lo garantiza la API (RLS), no estas
 * actions.
 */

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// La campanita vive en el layout de (app): hay que revalidar el layout entero
// para que el contador baje en todas las pantallas, no solo en la actual.
function revalidar() {
  revalidatePath("/", "layout");
}

/** Devuelve el mensaje de error, o null si salió bien. */
export async function markNotificationRead(id: string): Promise<string | null> {
  if (!z.string().uuid().safeParse(id).success) return "La notificación no es válida.";
  try {
    await apiFetch(`/v1/notifications/${id}/read`, { method: "POST" });
  } catch (error) {
    return message(error, "No pudimos marcar la notificación como leída.");
  }
  revalidar();
  return null;
}

export async function markAllNotificationsRead(): Promise<string | null> {
  try {
    await apiFetch("/v1/notifications/read-all", { method: "POST" });
  } catch (error) {
    return message(error, "No pudimos marcar las notificaciones como leídas.");
  }
  revalidar();
  return null;
}

/**
 * Lectura para el refresco periódico de la campanita. Es una action (y no un
 * fetch del navegador) porque el browser nunca habla con la API: solo el
 * servidor de Next puede reenviar la cookie de sesión.
 */
export async function fetchResumenNotificaciones(): Promise<ResumenNotificaciones> {
  return getResumenNotificaciones();
}
