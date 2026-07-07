"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updatePasswordSchema } from "@/lib/validations/auth";
import type { AuthState } from "@/actions/auth";

const profileSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre completo"),
});

export async function updateProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  // RLS: solo permite editar el propio perfil (users_update)
  const { error } = await supabase
    .from("users")
    .update({ nombre: parsed.data.nombre })
    .eq("id", user.id);

  if (error) {
    return { error: "No pudimos actualizar el perfil. Intentá de nuevo." };
  }

  revalidatePath("/", "layout");
  return { success: "Perfil actualizado." };
}

export async function changePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "same_password") {
      return { error: "La contraseña nueva debe ser distinta a la actual." };
    }
    return { error: "No pudimos cambiar la contraseña. Intentá de nuevo." };
  }

  return { success: "Contraseña actualizada." };
}
