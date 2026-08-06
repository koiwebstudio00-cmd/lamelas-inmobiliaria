"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import type { FeedbackEstado, FeedbackTipo } from "@/lib/types";

/**
 * Acciones del módulo de feedback (sugerencias y reportes de error). El
 * navegador nunca habla con la API: pasa por estas Server Actions, que reenvían
 * la sesión. Los adjuntos usan el mismo flujo de 3 pasos que las fotos de
 * propiedad (presign → PUT directo a R2 → confirm).
 */

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export interface PresignedUpload {
  r2_key: string;
  upload_url: string;
}

export async function crearFeedback(input: {
  tipo: FeedbackTipo;
  titulo: string;
  descripcion: string;
  url_contexto?: string;
  user_agent?: string;
}): Promise<{ id?: string; error?: string }> {
  try {
    const { item } = await apiFetch<{ item: { id: string } }>("/v1/feedback", {
      method: "POST",
      body: {
        tipo: input.tipo,
        titulo: input.titulo,
        descripcion: input.descripcion,
        ...(input.url_contexto ? { url_contexto: input.url_contexto } : {}),
        ...(input.user_agent ? { user_agent: input.user_agent } : {}),
      },
    });
    revalidatePath(input.tipo === "error" ? "/feedback/reportes" : "/feedback/sugerencias");
    return { id: item.id };
  } catch (error) {
    return { error: message(error, "No pudimos guardar tu feedback. Probá de nuevo.") };
  }
}

export async function cambiarEstadoFeedback(
  id: string,
  estado: FeedbackEstado
): Promise<string | null> {
  try {
    await apiFetch(`/v1/feedback/${id}`, { method: "PATCH", body: { estado } });
  } catch (error) {
    return message(error, "No se pudo cambiar el estado.");
  }
  revalidatePath(`/feedback/${id}`);
  revalidatePath("/feedback/sugerencias");
  revalidatePath("/feedback/reportes");
  return null;
}

export async function borrarFeedback(id: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/feedback/${id}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No se pudo eliminar.");
  }
  revalidatePath("/feedback/sugerencias");
  revalidatePath("/feedback/reportes");
  return null;
}

export async function agregarComentario(id: string, cuerpo: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/feedback/${id}/comentarios`, { method: "POST", body: { cuerpo } });
  } catch (error) {
    return message(error, "No se pudo guardar el comentario.");
  }
  revalidatePath(`/feedback/${id}`);
  return null;
}

/** Pide `count` URLs firmadas para subir imágenes de un reporte. */
export async function presignAdjuntos(
  feedbackId: string,
  count: number
): Promise<{ uploads?: PresignedUpload[]; error?: string }> {
  try {
    const { uploads } = await apiFetch<{ uploads: PresignedUpload[] }>(
      `/v1/feedback/${feedbackId}/adjuntos/presign`,
      { method: "POST", body: { count } }
    );
    return { uploads };
  } catch (error) {
    return { error: message(error, "No pudimos preparar la subida de imágenes.") };
  }
}

/** Registra en la base las imágenes que ya están en R2. */
export async function confirmAdjuntos(
  feedbackId: string,
  keys: string[]
): Promise<{ ok: number; error?: string }> {
  if (keys.length === 0) return { ok: 0 };
  try {
    const { adjuntos } = await apiFetch<{ adjuntos: unknown[] }>(
      `/v1/feedback/${feedbackId}/adjuntos/confirm`,
      { method: "POST", body: { keys } }
    );
    revalidatePath(`/feedback/${feedbackId}`);
    return { ok: adjuntos.length };
  } catch (error) {
    return { ok: 0, error: message(error, "No pudimos guardar las imágenes.") };
  }
}

export async function borrarAdjunto(
  adjuntoId: string,
  feedbackId: string
): Promise<string | null> {
  try {
    await apiFetch(`/v1/feedback/adjuntos/${adjuntoId}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No se pudo eliminar la imagen.");
  }
  revalidatePath(`/feedback/${feedbackId}`);
  return null;
}
