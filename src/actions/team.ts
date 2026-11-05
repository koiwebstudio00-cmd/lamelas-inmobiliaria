"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import { getUsuarios } from "@/lib/queries";
import type { EstadoEnvioPush, PruebaCorreo } from "@/lib/types";

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

  revalidatePath("/configuracion/equipo");
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
  revalidatePath("/configuracion/equipo");
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
  revalidatePath("/configuracion/equipo");
  revalidatePath("/propiedades");
  return null;
}

const changeUserPasswordSchema = z.object({
  new_password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  notify: z.boolean().optional().default(true),
});

/** Cambia la contraseña temporal de otro usuario del tenant. */
export async function changeUserPassword(
  id: string,
  data: { new_password: string; notify?: boolean }
): Promise<string | null> {
  const parsed = changeUserPasswordSchema.safeParse(data);
  if (!parsed.success) return parsed.error.issues[0].message;

  const denegado = await soloAdmin();
  if (denegado) return denegado;

  const target = (await getUsuarios()).find((u) => u.id === id);
  if (!target) return "No encontramos ese usuario.";
  if (target.rol === "super_admin") {
    return "No se puede cambiar la contraseña de una cuenta de soporte.";
  }

  try {
    await apiFetch(`/v1/users/${id}/password`, {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    return message(error, "No pudimos cambiar la contraseña.");
  }

  revalidatePath("/configuracion/equipo");
  return null;
}

// ── Pruebas de envío (Configuración → Equipo) ─────────────────────────────────

const idSchema = z.string().uuid();

/** Manda un correo de prueba directo y devuelve lo que contestó el servidor. */
export async function probarCorreo(
  userId: string
): Promise<{ resultado?: PruebaCorreo; error?: string }> {
  const prohibido = await soloAdmin();
  if (prohibido) return { error: prohibido };
  if (!idSchema.safeParse(userId).success) return { error: "Usuario inválido." };
  try {
    const resultado = await apiFetch<PruebaCorreo>("/v1/correos/prueba", {
      method: "POST",
      body: { user_id: userId },
    });
    return { resultado };
  } catch (error) {
    return { error: message(error, "No pudimos hacer la prueba. Intentá de nuevo.") };
  }
}

/** Encola un aviso push de prueba a los dispositivos de un usuario del equipo. */
export async function probarNotificacion(
  userId: string
): Promise<{ envioId?: string; error?: string }> {
  const prohibido = await soloAdmin();
  if (prohibido) return { error: prohibido };
  if (!idSchema.safeParse(userId).success) return { error: "Usuario inválido." };
  try {
    const r = await apiFetch<{ envio_id: string }>("/v1/push/prueba", {
      method: "POST",
      body: { user_id: userId },
    });
    return { envioId: r.envio_id };
  } catch (error) {
    return { error: message(error, "No pudimos mandar el aviso de prueba.") };
  }
}

/** Estado del aviso de prueba (el panel lo consulta cada 2 segundos). */
export async function estadoNotificacion(
  envioId: string
): Promise<{ estado?: EstadoEnvioPush; detalle?: string | null; error?: string }> {
  const prohibido = await soloAdmin();
  if (prohibido) return { error: prohibido };
  if (!idSchema.safeParse(envioId).success) return { error: "Envío inválido." };
  try {
    const { envio } = await apiFetch<{ envio: { estado: EstadoEnvioPush; error: string | null } }>(
      `/v1/push/envios/${envioId}`
    );
    return { estado: envio.estado, detalle: envio.error };
  } catch (error) {
    return { error: message(error, "No pudimos consultar el envío.") };
  }
}
