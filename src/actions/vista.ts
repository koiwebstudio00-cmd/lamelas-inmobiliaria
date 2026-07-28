"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { VISTA_COOKIE, esVista, type Vista } from "@/lib/vista";

/**
 * Guarda la vista elegida. Es una cookie de preferencia, no de sesión: no
 * lleva nada sensible, así que va sin httpOnly y con un año de vida.
 */
export async function setVista(vista: Vista, path: string) {
  if (!esVista(vista)) return;

  const cookieStore = await cookies();
  cookieStore.set(VISTA_COOKIE, vista, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // La página es un Server Component: sin esto seguiría mostrando la vista
  // anterior hasta la próxima navegación.
  revalidatePath(path);
}
