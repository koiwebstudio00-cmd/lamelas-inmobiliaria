"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Fotos de una propiedad.
 *
 * La subida es en tres pasos: pedimos URLs firmadas, el navegador manda el
 * archivo directo a R2 (no pasa por Next ni por la API) y después confirmamos
 * las que llegaron. Estas actions son el puente: el navegador no puede hablar
 * con la API por sí solo, pero sí con R2, que no usa cookies.
 */

export interface PresignedUpload {
  r2_key: string;
  upload_url: string;
}

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Pide `count` URLs firmadas. Devuelve `error` si la API dijo que no. */
export async function presignPhotos(
  propertyId: string,
  count: number
): Promise<{ uploads?: PresignedUpload[]; error?: string }> {
  try {
    const { uploads } = await apiFetch<{ uploads: PresignedUpload[] }>(
      `/v1/properties/${propertyId}/images/presign`,
      { method: "POST", body: { count } }
    );
    return { uploads };
  } catch (error) {
    return { error: message(error, "No pudimos preparar la subida de fotos.") };
  }
}

/** Registra en la base las fotos que ya están en R2. */
export async function confirmPhotos(
  propertyId: string,
  keys: string[]
): Promise<{ ok: number; error?: string }> {
  if (keys.length === 0) return { ok: 0 };
  try {
    const { images } = await apiFetch<{ images: unknown[] }>(
      `/v1/properties/${propertyId}/images/confirm`,
      { method: "POST", body: { keys } }
    );
    revalidatePath("/propiedades");
    revalidatePath("/mis-propiedades");
    revalidatePath(`/propiedades/${propertyId}`);
    return { ok: images.length };
  } catch (error) {
    return { ok: 0, error: message(error, "No pudimos guardar las fotos subidas.") };
  }
}

/** Devuelve el mensaje de error, o null si salió bien. */
export async function setPortada(
  imageId: string,
  propertyId: string
): Promise<string | null> {
  try {
    await apiFetch(`/v1/images/${imageId}/portada`, { method: "PATCH", body: {} });
  } catch (error) {
    return message(error, "No se pudo cambiar la portada.");
  }
  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  revalidatePath(`/propiedades/${propertyId}`);
  return null;
}

/**
 * Borra la foto. La API borra también el objeto en R2 y, si era la portada,
 * promueve la siguiente.
 */
export async function deletePhoto(
  imageId: string,
  propertyId: string
): Promise<string | null> {
  try {
    await apiFetch(`/v1/images/${imageId}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No se pudo eliminar la foto.");
  }
  revalidatePath("/propiedades");
  revalidatePath("/mis-propiedades");
  revalidatePath(`/propiedades/${propertyId}`);
  return null;
}
