"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";

const schema = z.object({
  tipo: z.enum(["lead_asignado"]),
  activo: z.boolean(),
});

/** Prende o apaga un tipo de correo de operación para la inmobiliaria. Devuelve el error, o null. */
export async function guardarCorreoActivo(input: {
  tipo: "lead_asignado";
  activo: boolean;
}): Promise<string | null> {
  const me = await getCurrentUser();
  if (!me || !esAdmin(me.rol)) return "No tenés permiso para hacer esto.";
  const parsed = schema.safeParse(input);
  if (!parsed.success) return "Datos inválidos.";
  try {
    await apiFetch("/v1/tenants/current", {
      method: "PATCH",
      body: { correos_activos: { [parsed.data.tipo]: parsed.data.activo } },
    });
  } catch (error) {
    return error instanceof ApiError ? error.message : "No se pudo guardar. Probá de nuevo.";
  }
  revalidatePath("/configuracion/correos");
  return null;
}
