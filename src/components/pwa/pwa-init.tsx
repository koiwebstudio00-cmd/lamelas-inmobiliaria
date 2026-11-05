"use client";

import { useEffect } from "react";
import { escucharAvisoInstalacion, registrarServiceWorker } from "@/lib/pwa";

let iniciado = false;

/**
 * Registra el service worker y guarda el aviso de instalación de Android
 * (PUSH-PWA-01). Vive en el layout del panel; no pinta nada.
 */
export function PwaInit() {
  useEffect(() => {
    if (iniciado) return;
    iniciado = true;
    escucharAvisoInstalacion();
    void registrarServiceWorker();
  }, []);
  return null;
}
