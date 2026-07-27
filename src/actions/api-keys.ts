"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Keys de lectura del sitio público (lamelas-web).
 *
 * La key completa se ve una sola vez, al crearla: la API guarda solo el hash.
 * Por eso `createApiKey` la devuelve en el estado del formulario, para que la
 * pantalla la muestre y avise que hay que copiarla ahora.
 */

export type ApiKeyState = { error?: string; key?: string; nombre?: string };

const nombreSchema = z
  .string()
  .trim()
  .min(1, "Poné un nombre para reconocerla después")
  .max(100, "El nombre es demasiado largo");

export async function createApiKey(
  _prev: ApiKeyState,
  formData: FormData
): Promise<ApiKeyState> {
  const parsed = nombreSchema.safeParse(formData.get("nombre"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const { key } = await apiFetch<{ key: string }>("/v1/api-keys", {
      method: "POST",
      body: { nombre: parsed.data },
    });
    revalidatePath("/configuracion");
    return { key, nombre: parsed.data };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos crear la key. Intentá de nuevo." };
  }
}

/**
 * Revocar es inmediato: el sitio que use esa key deja de responder. Devuelve
 * el mensaje de error, o null si salió bien.
 */
export async function revokeApiKey(id: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/api-keys/${id}`, { method: "DELETE" });
  } catch (error) {
    return error instanceof ApiError ? error.message : "No pudimos revocar la key.";
  }
  revalidatePath("/configuracion");
  return null;
}
