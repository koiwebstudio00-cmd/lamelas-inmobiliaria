"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch, getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import type { ChannelCanal } from "@/lib/types";

/**
 * Conexión del número de WhatsApp por Zernio.
 *
 * El panel nunca ve la API key de Zernio: le pide al backend una `auth_url` ya
 * armada y manda al usuario ahí. Al volver, tampoco confía en los query params
 * del redirect para la identidad de la cuenta — el backend vuelve a
 * preguntarle a Zernio cuál quedó conectada. Ver
 * `lamelas-agent/docs/plan-implementacion-zernio.md` §4.
 */

/**
 * Defensa en profundidad. La API ya rechaza a un vendedor con 403, pero una
 * Server Action es un endpoint HTTP real, alcanzable con un POST armado a
 * mano: no quiero que la única barrera esté del otro lado de la red.
 */
async function soloAdmin(): Promise<string | null> {
  const me = await getCurrentUser();
  if (!me || !esAdmin(me.rol)) return "No tenés permiso para hacer esto.";
  return null;
}

const RUTA = "/whatsapp/conectar";

/**
 * Paso 1: pedir la URL de autorización de Meta. Se devuelve en vez de redirigir
 * acá para que la pantalla pueda mostrar el error si algo falla, en lugar de
 * mandar al usuario a una página en blanco.
 */
export async function obtenerUrlDeConexion(
  canal: ChannelCanal
): Promise<{ url?: string; error?: string }> {
  const denegado = await soloAdmin();
  if (denegado) return { error: denegado };

  try {
    const { auth_url } = await apiFetch<{ auth_url: string }>(
      `/v1/integrations/channels/${canal}/connect-url`
    );
    return { url: auth_url };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos contactar a Zernio. Intentá de nuevo." };
  }
}

/**
 * Paso 2: se llama desde la pantalla de callback, cuando Meta devolvió al
 * usuario. Confirma contra Zernio qué cuenta quedó conectada y la guarda.
 */
export async function completarConexion(
  canal: ChannelCanal
): Promise<{ error?: string }> {
  const denegado = await soloAdmin();
  if (denegado) return { error: denegado };

  try {
    await apiFetch(`/v1/integrations/channels/callback`, { query: { canal } });
    revalidatePath(RUTA);
    return {};
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos confirmar la conexión. Probá de nuevo en unos segundos." };
  }
}

export async function desconectarCanal(id: string): Promise<string | null> {
  const denegado = await soloAdmin();
  if (denegado) return denegado;

  try {
    await apiFetch(`/v1/integrations/channels/${id}`, { method: "DELETE" });
    revalidatePath(RUTA);
    return null;
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No pudimos desconectar el número. Intentá de nuevo.";
  }
}

/**
 * Le pregunta a Zernio si la cuenta sigue viva. Sirve para distinguir "Sofi no
 * contesta porque el número se cayó" de "Sofi no contesta por otra cosa".
 */
export async function verificarCanal(id: string): Promise<{ error?: string }> {
  const denegado = await soloAdmin();
  if (denegado) return { error: denegado };

  try {
    await apiFetch(`/v1/integrations/channels/${id}/health`);
    revalidatePath(RUTA);
    return {};
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos verificar la conexión." };
  }
}
