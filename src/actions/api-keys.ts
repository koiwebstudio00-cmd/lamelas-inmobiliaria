"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import type { ApiKeyScope } from "@/lib/types";

/**
 * Keys de las integraciones que consumen la API: el sitio público (lamelas-web)
 * y el agente de IA. Lo que separa a una de otra son los scopes, no el código.
 *
 * La key completa se ve una sola vez, al crearla: la API guarda solo el hash.
 * Por eso `createApiKey` la devuelve en el estado del formulario, para que la
 * pantalla la muestre y avise que hay que copiarla ahora.
 */

export type ApiKeyState = {
  error?: string;
  key?: string;
  nombre?: string;
  /** Los scopes con los que se creó: la pantalla explica dónde va según eso. */
  scopes?: ApiKeyScope[];
};

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

/**
 * Los valores válidos los define el backend (`lib/scopes.ts`) y el formulario
 * los pinta desde `GET /v1/integrations/scopes`. Acá se validan igual: el
 * `formData` de una Server Action se puede armar a mano, y un scope inventado
 * tiene que fallar con un mensaje nuestro y no con un 400 crudo de la API.
 */
const scopesSchema = z
  .array(z.enum(["export:read", "agent:read", "agent:write"]))
  .min(1, "Elegí al menos un permiso para la integración");

export async function createApiKey(
  _prev: ApiKeyState,
  formData: FormData
): Promise<ApiKeyState> {
  const denegado = await soloAdmin();
  if (denegado) return { error: denegado };

  const nombre = nombreSchema.safeParse(formData.get("nombre"));
  if (!nombre.success) return { error: nombre.error.issues[0].message };

  const scopes = scopesSchema.safeParse(formData.getAll("scopes"));
  if (!scopes.success) return { error: scopes.error.issues[0].message };

  try {
    const { key } = await apiFetch<{ key: string }>("/v1/integrations/api-keys", {
      method: "POST",
      body: { nombre: nombre.data, scopes: scopes.data as ApiKeyScope[] },
    });
    revalidatePath("/configuracion");
    return { key, nombre: nombre.data, scopes: scopes.data as ApiKeyScope[] };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos crear la key. Intentá de nuevo." };
  }
}

/**
 * Revocar es inmediato: el sistema que use esa key deja de responder. Devuelve
 * el mensaje de error, o null si salió bien.
 */
export async function revokeApiKey(id: string): Promise<string | null> {
  const denegado = await soloAdmin();
  if (denegado) return denegado;

  try {
    await apiFetch(`/v1/integrations/api-keys/${id}`, { method: "DELETE" });
  } catch (error) {
    return error instanceof ApiError ? error.message : "No pudimos revocar la key.";
  }
  revalidatePath("/configuracion");
  return null;
}
