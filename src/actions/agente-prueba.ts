"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { getConversacionDeLead } from "@/lib/queries";

/**
 * Acciones del probador del agente.
 *
 * El browser NO le pega directo a n8n: la URL del webhook del workflow web vive
 * del lado del servidor (AGENT_CHAT_WEBHOOK_URL) y solo estas actions la conocen.
 * Cada conversación de prueba usa un `session_id` con prefijo `prueba-`, que el
 * backend guarda como `canal_ref` del lead — así se distinguen de las reales.
 */

const WEBHOOK_URL = process.env.AGENT_CHAT_WEBHOOK_URL;

export interface RespuestaAgente {
  mensajes?: string[];
  error?: string;
}

export type TurnoPrueba = { rol: "lead" | "agente" | "sistema"; texto: string };

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Manda un mensaje a Sofi por el workflow web y devuelve lo que respondió. */
export async function enviarMensajeAgente(input: {
  sessionId: string;
  nombre?: string;
  mensaje: string;
}): Promise<RespuestaAgente> {
  if (!WEBHOOK_URL) {
    return {
      error:
        "El probador no está configurado. Falta la variable AGENT_CHAT_WEBHOOK_URL en el servidor del panel.",
    };
  }

  const mensaje = input.mensaje.trim();
  if (!mensaje) return { mensajes: [] };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: input.sessionId, nombre: input.nombre ?? "", mensaje }),
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        error: `El agente respondió ${res.status}. Verificá que el workflow web esté activo en n8n.`,
      };
    }

    const data = (await res.json().catch(() => ({}))) as { mensajes?: unknown };
    const mensajes = Array.isArray(data.mensajes)
      ? data.mensajes.filter((m): m is string => typeof m === "string")
      : [];
    return { mensajes };
  } catch {
    return {
      error:
        "No pudimos contactar al agente. Revisá que el webhook esté configurado y el workflow activo.",
    };
  }
}

/** Carga el historial de una conversación de prueba (por el lead). */
export async function cargarConversacionPrueba(
  leadId: string
): Promise<{ turnos: TurnoPrueba[]; error?: string }> {
  try {
    const chat = await getConversacionDeLead(leadId);
    if (!chat) return { turnos: [] };
    const turnos: TurnoPrueba[] = chat.mensajes.map((m) => {
      const rol: TurnoPrueba["rol"] =
        m.rol === "lead" ? "lead" : m.rol === "agente_ia" ? "agente" : "sistema";
      return { rol, texto: m.contenido };
    });
    return { turnos };
  } catch (error) {
    return { turnos: [], error: message(error, "No pudimos cargar la conversación.") };
  }
}

/** Borra una conversación de prueba (reusa el delete de leads; solo admin). */
export async function borrarConversacionPrueba(leadId: string): Promise<string | null> {
  try {
    await apiFetch(`/v1/leads/${leadId}`, { method: "DELETE" });
  } catch (error) {
    return message(error, "No se pudo borrar la conversación.");
  }
  revalidatePath("/probar-agente");
  return null;
}
