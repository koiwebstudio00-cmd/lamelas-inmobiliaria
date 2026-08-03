"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Conversaciones del agente de IA.
 *
 * Quién puede tomar o soltar una conversación lo decide la API (RLS + rol): un
 * vendedor solo sobre las suyas, un admin sobre cualquiera. Acá solo traducimos
 * el error al castellano de la pantalla y revalidamos el detalle del lead, que
 * es donde vive el hilo.
 */

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function revalidar(leadId: string) {
  revalidatePath("/");
  revalidatePath("/consultas");
  revalidatePath(`/consultas/${leadId}`);
}

/** El vendedor toma el chat: el bot queda mudo y se frena el timeout de handoff. */
export async function takeConversacion(id: string, leadId: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/conversations/${id}/take`, { method: "POST" });
  } catch (error) {
    return message(error, "No pudimos tomar la conversación.");
  }
  revalidar(leadId);
  return null;
}

/** Devuelve el chat al bot (se atendió por otro lado, o fue un falso positivo). */
export async function releaseConversacion(id: string, leadId: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/conversations/${id}/release`, { method: "POST" });
  } catch (error) {
    return message(error, "No pudimos devolver la conversación al bot.");
  }
  revalidar(leadId);
  return null;
}
