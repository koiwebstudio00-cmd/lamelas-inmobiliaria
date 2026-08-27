import { redirect } from "next/navigation";
import { completarConexion } from "@/actions/channels";
import type { ChannelCanal } from "@/lib/types";

export const metadata = { title: "Conectando… — Lamelas & Chaumont" };

/**
 * Adonde vuelve el usuario después de autorizar en Meta. No lee la identidad de
 * la cuenta de los query params —vienen de un redirect, podrían estar
 * manipulados—: solo usa `canal` para pedirle al backend que confirme contra
 * Zernio cuál quedó conectada de verdad.
 *
 * Es una pantalla de paso: siempre termina en un redirect a la de conexión, con
 * el resultado en la URL.
 */
export default async function CallbackConexionPage({
  searchParams,
}: {
  searchParams: Promise<{
    canal?: string;
    connected?: string;
    accountId?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const canal = params.canal ?? params.connected;
  const destino = "/whatsapp/conectar";

  if (params.error) {
    redirect(`${destino}?error=${encodeURIComponent(params.error)}`);
  }

  if (canal !== "whatsapp") {
    redirect(`${destino}?error=${encodeURIComponent("Canal desconocido en la vuelta de Meta.")}`);
  }

  const { error } = await completarConexion(canal as ChannelCanal, params.accountId);
  redirect(error ? `${destino}?error=${encodeURIComponent(error)}` : `${destino}?conectado=1`);
}
