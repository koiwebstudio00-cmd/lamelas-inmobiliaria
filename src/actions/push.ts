"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";
import { preferenciasSchema, suscripcionSchema, type SuscripcionInput } from "@/lib/validations/push";

// Notificaciones al celular (PUSH-PWA-01). El navegador arma la suscripción
// (pushManager.subscribe) y la manda acá; la API nunca la recibe directo del
// navegador (regla del BFF). Todas devuelven el mensaje de error o null.

function mensaje(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/** Registra este celular y, si se pide, deja el push como canal elegido. */
export async function activarPushEnDispositivo(
  sub: SuscripcionInput,
  opciones: { soloPush: boolean }
): Promise<string | null> {
  const parsed = suscripcionSchema.safeParse(sub);
  if (!parsed.success) return "El navegador devolvió una suscripción inválida.";
  try {
    await apiFetch("/v1/push/dispositivos", { method: "POST", body: parsed.data });
    await apiFetch("/v1/push/preferencias", {
      method: "PATCH",
      body: opciones.soloPush ? { push: true, correo: false } : { push: true },
    });
  } catch (error) {
    return mensaje(error, "No pudimos activar las notificaciones. Probá de nuevo.");
  }
  revalidatePath("/perfil");
  return null;
}

export async function actualizarPreferenciasAviso(cambios: {
  push?: boolean;
  correo?: boolean;
}): Promise<string | null> {
  const parsed = preferenciasSchema.safeParse(cambios);
  if (!parsed.success) return "Elegí al menos una forma de aviso.";
  try {
    await apiFetch("/v1/push/preferencias", { method: "PATCH", body: parsed.data });
  } catch (error) {
    return mensaje(error, "No pudimos guardar el cambio.");
  }
  revalidatePath("/perfil");
  return null;
}

export async function quitarDispositivo(id: string): Promise<string | null> {
  if (!z.string().uuid().safeParse(id).success) return "Dispositivo inválido.";
  try {
    await apiFetch(`/v1/push/dispositivos/${id}`, { method: "DELETE" });
  } catch (error) {
    return mensaje(error, "No pudimos quitar el dispositivo.");
  }
  revalidatePath("/perfil");
  return null;
}

export async function enviarAvisoDePrueba(): Promise<string | null> {
  try {
    await apiFetch("/v1/push/prueba", { method: "POST", body: {} });
  } catch (error) {
    return mensaje(error, "No pudimos mandar el aviso de prueba.");
  }
  return null;
}
