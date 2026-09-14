"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";

export type FollowupSettingsState = {
  error?: string;
  success?: string;
};

async function onlyAdmin() {
  const me = await getCurrentUser();
  return Boolean(me && esAdmin(me.rol));
}

const messageSchema = z
  .string()
  .trim()
  .min(1, "Los mensajes no pueden quedar vacíos.")
  .max(1000, "Cada mensaje puede tener hasta 1000 caracteres.");

export async function saveFollowupSettings(
  _previous: FollowupSettingsState,
  formData: FormData
): Promise<FollowupSettingsState> {
  if (!(await onlyAdmin())) return { error: "No tenés permiso para hacer esto." };

  const parsed = z
    .object({
      firstMessage: messageSchema,
      secondMessage: messageSchema
    })
    .safeParse({
      firstMessage: formData.get("first_message"),
      secondMessage: formData.get("second_message")
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    await apiFetch("/v1/tenants/current", {
      method: "PATCH",
      body: {
        seguimiento_activo: formData.get("enabled") === "on",
        seguimiento_mensaje_1: parsed.data.firstMessage,
        seguimiento_mensaje_2: parsed.data.secondMessage
      }
    });
    revalidatePath("/whatsapp/ajustes-agente");
    return { success: "Configuración de seguimiento guardada." };
  } catch (error) {
    return {
      error: error instanceof ApiError
        ? error.message
        : "No pudimos guardar la configuración. Intentá de nuevo."
    };
  }
}

export async function setAgentEnabled(enabled: boolean): Promise<string | null> {
  if (!(await onlyAdmin())) return "No tenés permiso para hacer esto.";
  try {
    await apiFetch("/v1/tenants/current", {
      method: "PATCH",
      body: { agente_activo: enabled }
    });
    revalidatePath("/whatsapp/ajustes-agente");
    return null;
  } catch (error) {
    return error instanceof ApiError
      ? error.message
      : "No pudimos cambiar el estado del agente. Intentá de nuevo.";
  }
}
