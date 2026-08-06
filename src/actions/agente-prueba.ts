"use server";

/**
 * Proxy del panel hacia el workflow web del agente (`lamelas-agente-web`), que
 * expone un webhook sincrónico y devuelve los mensajes de Sofi. El browser NO le
 * pega directo a n8n: la URL del webhook vive del lado del servidor
 * (AGENT_CHAT_WEBHOOK_URL) y solo esta action la conoce.
 *
 * Ojo: cada conversación de prueba crea un lead/conversación reales de canal
 * `web` en el CRM (así lo hace el workflow). Se identifican por el `session_id`
 * con prefijo `prueba-`.
 */

const WEBHOOK_URL = process.env.AGENT_CHAT_WEBHOOK_URL;

export interface RespuestaAgente {
  mensajes?: string[];
  error?: string;
}

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
      body: JSON.stringify({
        session_id: input.sessionId,
        nombre: input.nombre ?? "",
        mensaje,
      }),
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
