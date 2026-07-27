"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";
import type { AuthState } from "@/actions/auth";

const profileSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre completo"),
});

/**
 * El cambio de contraseña desde el perfil pide la actual: es distinto del
 * cambio por link de recuperación, que se valida con el token del mail.
 */
const passwordSchema = z.object({
  current_password: z.string().min(1, "Ingresá tu contraseña actual"),
  new_password: z.string().min(8, "La contraseña nueva debe tener al menos 8 caracteres"),
});

export async function updateProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await apiFetch("/v1/users/me", {
      method: "PATCH",
      body: { nombre: parsed.data.nombre },
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos actualizar el perfil. Intentá de nuevo." };
  }

  revalidatePath("/", "layout");
  return { success: "Perfil actualizado." };
}

export async function changePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.current_password === parsed.data.new_password) {
    return { error: "La contraseña nueva debe ser distinta a la actual." };
  }

  try {
    await apiFetch("/v1/users/me/password", {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    // La API ya devuelve "La contraseña actual es incorrecta." en el 401.
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos cambiar la contraseña. Intentá de nuevo." };
  }

  return { success: "Contraseña actualizada." };
}
