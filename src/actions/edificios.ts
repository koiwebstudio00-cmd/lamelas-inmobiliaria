"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Edificios: agrupan las unidades de una misma torre.
 *
 * El alta se hace desde el formulario de propiedad (ver `resolverEdificio` en
 * actions/properties.ts). Renombrar y borrar son solo de admin: lo decide la
 * API, acá solo se traduce el error.
 */

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function revalidar() {
  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  revalidatePath("/propiedades/edificios");
}

const nombreSchema = z
  .string()
  .trim()
  .min(1, "Ingresá el nombre del edificio.")
  .max(120, "El nombre es demasiado largo.");

/** Devuelve el mensaje de error, o null si salió bien. */
export async function renameEdificio(id: string, nombre: string): Promise<string | null> {
  const parsed = nombreSchema.safeParse(nombre);
  if (!parsed.success) return parsed.error.issues[0].message;
  try {
    await apiFetch(`/v1/edificios/${id}`, { method: "PATCH", body: { nombre: parsed.data } });
  } catch (error) {
    return message(error, "No pudimos renombrar el edificio.");
  }
  revalidar();
  return null;
}

/** Borra el edificio; sus unidades quedan como propiedades sueltas. */
export async function deleteEdificio(id: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/edificios/${id}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No pudimos borrar el edificio.");
  }
  revalidar();
  return null;
}
