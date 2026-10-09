"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Incidentes del agente (solo admin). Que solo un admin pueda resolverlos lo
 * garantiza la API (RLS); acá no se repite.
 */
export async function resolveIncident(id: string): Promise<string | null> {
  if (!z.string().uuid().safeParse(id).success) return "El incidente no es válido.";
  try {
    await apiFetch(`/v1/incidents/${id}/resolver`, { method: "POST" });
  } catch (error) {
    return error instanceof ApiError ? error.message : "No pudimos marcar el incidente como resuelto.";
  }
  // El contador del menú vive en el layout.
  revalidatePath("/", "layout");
  return null;
}
