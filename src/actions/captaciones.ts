"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch } from "@/lib/api";
import {
  armarMensaje,
  barrioDe,
  DATOS_VACIOS,
  direccionCompleta,
  localidadDe,
  primerPasoConErrores,
  type CaptacionDatos,
} from "@/lib/captacion";

/**
 * Captaciones (CAPTACION-01). El navegador no habla con la API: el formulario
 * llama a estas Server Actions, que vuelven a validar todo antes de guardar.
 */

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

const texto = z.string().max(500);
const datosSchema = z.object({
  ...Object.fromEntries(
    (Object.keys(DATOS_VACIOS) as (keyof CaptacionDatos)[])
      .filter((k) => typeof DATOS_VACIOS[k] === "string")
      .map((k) => [k, k === "observaciones" || k === "visitas" ? z.string().max(2000) : texto]),
  ),
  moneda: z.enum(["ARS", "USD"]),
  cochera_cubierta: z.boolean(),
  ambientes: z.array(texto).max(30),
  comodidades: z.array(texto).max(30),
  servicios: z.array(texto).max(30),
}) as unknown as z.ZodType<CaptacionDatos>;

const inputSchema = z.object({
  datos: datosSchema,
  responsable: z.string().trim().min(1).max(120),
  /** El mensaje puede venir editado a mano en el último paso. */
  mensaje: z.string().trim().max(5000).optional(),
});

export type GuardarCaptacionResult = { id?: string; mensaje?: string; error?: string; paso?: number };

export async function guardarCaptacion(
  id: string | null,
  input: { datos: CaptacionDatos; responsable: string; mensaje?: string },
): Promise<GuardarCaptacionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisá los datos del formulario." };
  const { datos, responsable } = parsed.data;
  const conErrores = primerPasoConErrores(datos);
  if (conErrores) return { error: "Faltan datos obligatorios.", paso: conErrores.paso };

  const mensaje = parsed.data.mensaje || armarMensaje(datos, responsable);
  const body = {
    responsable_id: datos.responsable_id || null,
    tipo: datos.tipo,
    direccion: direccionCompleta(datos),
    localidad: localidadDe(datos) || null,
    barrio: barrioDe(datos) || null,
    datos,
    mensaje,
  };
  try {
    const { item } = await apiFetch<{ item: { id: string } }>(id ? `/v1/captaciones/${id}` : "/v1/captaciones", {
      method: id ? "PATCH" : "POST",
      body,
    });
    revalidatePath("/captaciones");
    revalidatePath(`/captaciones/${item.id}`);
    return { id: item.id, mensaje };
  } catch (error) {
    return { error: message(error, "No pudimos guardar la captación. Probá de nuevo.") };
  }
}

/** Guarda solo el texto del mensaje cuando la persona lo editó antes de enviar. */
export async function guardarMensajeCaptacion(id: string, mensaje: string): Promise<string | null> {
  const limpio = mensaje.trim();
  if (!limpio || limpio.length > 5000) return "El mensaje está vacío o es demasiado largo.";
  try {
    const { item } = await apiFetch<{ item: { datos: unknown; tipo: string; direccion: string; localidad: string | null; barrio: string | null; responsable: { id: string } | null } }>(
      `/v1/captaciones/${id}`,
    );
    await apiFetch(`/v1/captaciones/${id}`, {
      method: "PATCH",
      body: {
        responsable_id: item.responsable?.id ?? null,
        tipo: item.tipo,
        direccion: item.direccion,
        localidad: item.localidad,
        barrio: item.barrio,
        datos: item.datos ?? {},
        mensaje: limpio,
      },
    });
  } catch (error) {
    return message(error, "No se pudo guardar el mensaje.");
  }
  revalidatePath(`/captaciones/${id}`);
  return null;
}

export async function eliminarCaptacion(id: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/captaciones/${id}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No se pudo eliminar la captación.");
  }
  revalidatePath("/captaciones");
  return null;
}
