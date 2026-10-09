"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir la página al servidor cada `cadaMs` mientras la pestaña está
 * visible, y al volver a ella. Para pantallas compartidas (el canal de
 * feedback) donde otros escriben mientras mirás. Es el mismo criterio que la
 * campanita: polling simple, sin conexiones abiertas.
 */
export function AutoRefresh({ cadaMs = 30_000 }: { cadaMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refrescar = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refrescar, cadaMs);
    document.addEventListener("visibilitychange", refrescar);
    window.addEventListener("focus", refrescar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refrescar);
      window.removeEventListener("focus", refrescar);
    };
  }, [router, cadaMs]);

  return null;
}
