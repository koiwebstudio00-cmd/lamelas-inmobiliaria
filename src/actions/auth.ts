"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiError, apiFetch, endSession, startSession } from "@/lib/api";
import {
  acceptInvitationSchema,
  loginSchema,
  recoverSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";

export type AuthState = { error?: string; success?: string };

/**
 * Los mensajes de error de la API ya vienen en castellano y pensados para el
 * usuario, así que se muestran tal cual. Solo cubrimos el caso de que la API no
 * conteste.
 */
function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await startSession("/v1/auth/login", parsed.data);
  } catch (error) {
    return { error: message(error, "No pudimos conectarnos con el servidor. Probá de nuevo.") };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Alta desde el link de invitación: crea la cuenta y deja la sesión abierta. */
export async function acceptInvitation(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = acceptInvitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await startSession("/v1/auth/accept-invitation", parsed.data);
  } catch (error) {
    return { error: message(error, "No pudimos crear la cuenta. Probá de nuevo.") };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function recoverPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = recoverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await apiFetch("/v1/auth/forgot-password", { method: "POST", body: parsed.data });
  } catch (error) {
    // El 429 del rate limit sí hay que mostrarlo; el resto no, para no delatar
    // qué emails existen.
    if (error instanceof ApiError && error.status === 429) return { error: error.message };
  }

  return {
    success: "Si el email existe, te enviamos un link para restablecer la contraseña.",
  };
}

/** Contraseña nueva desde el link de recuperación. No abre sesión: hay que entrar. */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await apiFetch("/v1/auth/reset-password", { method: "POST", body: parsed.data });
  } catch (error) {
    return { error: message(error, "No pudimos actualizar la contraseña. Pedí un link nuevo.") };
  }

  redirect("/login?clave=actualizada");
}
