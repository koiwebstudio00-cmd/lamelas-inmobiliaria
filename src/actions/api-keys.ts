"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";

/**
 * Keys de lectura del sitio público (lamelas-web).
 *
 * La key completa se ve una sola vez, al crearla: la API guarda solo el hash.
 * Por eso `createApiKey` la devuelve en el estado del formulario, para que la
 * pantalla la muestre y avise que hay que copiarla ahora.
 */

export type ApiKeyState = { error?: string; key?: string; nombre?: string };

/**
 * Defensa en profundidad. La API ya rechaza a un vendedor con 403, pero una
 * Server Action es un endpoint HTTP real, alcanzable con un POST armado a
 * mano: no quiero que la única barrera esté del otro lado de la red.
 */
async function soloAdmin(): Promise<string | null> {
  const me = await getCurrentUser();
  if (!me || !esAdmin(me.rol)) return "No tenés permiso para hacer esto.";
  return null;
}

const nombreSchema = z
  .string()
  .trim()
  .min(1, "Poné un nombre para reconocerla después")
  .max(100, "El nombre es demasiado largo");

export async function createApiKey(
  _prev: ApiKeyState,
  formData: FormData
): Promise<ApiKeyState> {
  const denegado = await soloAdmin();
  if (denegado) return { error: denegado };

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
  const denegado = await soloAdmin();
  if (denegado) return denegado;

  try {
    await apiFetch(`/v1/api-keys/${id}`, { method: "DELETE" });
  } catch (error) {
    return error instanceof ApiError ? error.message : "No pudimos revocar la key.";
  }
  revalidatePath("/configuracion");
  return null;
}
