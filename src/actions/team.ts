"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";

/**
 * Equipo: usuarios e invitaciones. Todo esto es solo para admins — lo impone
 * la API, no el panel; acá solo mostramos el error que devuelve.
 *
 * No hay alta directa de usuarios: se invita por email y la persona elige su
 * contraseña desde el link. Tampoco hay baja: un usuario se desactiva, así no
 * se pierden las propiedades ni las consultas que tiene asociadas.
 */

export type TeamState = { error?: string; success?: string };

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

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

const inviteSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  rol: z.enum(["admin", "agente"]),
});

export async function inviteUser(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const denegado = await soloAdmin();
  if (denegado) return { error: denegado };

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await apiFetch("/v1/invitations", { method: "POST", body: parsed.data });
  } catch (error) {
    // La API ya dice "Ya existe una cuenta con ese email." cuando corresponde.
    return { error: message(error, "No pudimos enviar la invitación.") };
  }

  revalidatePath("/equipo");
  return { success: `Le enviamos la invitación a ${parsed.data.email}.` };
}

/** Devuelve el mensaje de error, o null si salió bien. */
export async function revokeInvitation(id: string): Promise<string | null> {
  const denegado = await soloAdmin();
  if (denegado) return denegado;

  try {
    await apiFetch(`/v1/invitations/${id}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No pudimos cancelar la invitación.");
  }
  revalidatePath("/equipo");
  return null;
}

/**
 * Cambia el rol o activa/desactiva. La API protege el último admin activo:
 * si es el único, devuelve un 409 con el motivo y lo mostramos tal cual.
 */
export async function updateUsuario(
  id: string,
  data: { rol?: "admin" | "agente"; estado?: "activo" | "inactivo" }
): Promise<string | null> {
  const parsed = z
    .object({
      rol: z.enum(["admin", "agente"]).optional(),
      estado: z.enum(["activo", "inactivo"]).optional(),
    })
    .safeParse(data);
  if (!parsed.success) return "Ese cambio no es válido.";

  const denegado = await soloAdmin();
  if (denegado) return denegado;

  try {
    await apiFetch(`/v1/users/${id}`, { method: "PATCH", body: parsed.data });
  } catch (error) {
    return message(error, "No pudimos actualizar al usuario.");
  }
  revalidatePath("/equipo");
  revalidatePath("/propiedades");
  return null;
}
