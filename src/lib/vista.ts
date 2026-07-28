import { cookies } from "next/headers";

/**
 * Vista de las listas del panel. La preferencia vive en una cookie propia (no
 * en la URL) para que sea una decisión del usuario y no del link: elegís una
 * vez y te sigue por todas las secciones y en la próxima sesión.
 */
export type Vista = "tabla" | "cards";

export const VISTA_COOKIE = "vista";
export const VISTA_POR_DEFECTO: Vista = "tabla";

export function esVista(valor: string | undefined): valor is Vista {
  return valor === "tabla" || valor === "cards";
}

/** Lee la preferencia en un Server Component. */
export async function getVista(): Promise<Vista> {
  const cookieStore = await cookies();
  const valor = cookieStore.get(VISTA_COOKIE)?.value;
  return esVista(valor) ? valor : VISTA_POR_DEFECTO;
}
