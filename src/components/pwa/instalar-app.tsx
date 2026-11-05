"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  avisoInstalacion,
  consumirAvisoInstalacion,
  esAppInstalada,
  esIOS,
  suscribirseAlAviso,
  useEnNavegador,
} from "@/lib/pwa";

/**
 * Botón "Instalar app" (PUSH-PWA-01).
 * - Android / Chrome: abre el diálogo de instalación del sistema.
 * - iPhone: iOS no deja instalar desde un botón. Abre el menú Compartir (donde
 *   está "Agregar a inicio") y muestra los pasos.
 * - Ya instalada: no se muestra.
 */
export function InstalarApp({ className }: { className?: string }) {
  const aviso = useSyncExternalStore(suscribirseAlAviso, avisoInstalacion, () => null);
  const montado = useEnNavegador(() => true, false);
  const yaInstalada = useEnNavegador(esAppInstalada, false);
  const ios = useEnNavegador(esIOS, false);
  const [recienInstalada, setRecienInstalada] = useState(false);
  const [guia, setGuia] = useState(false);

  if (!montado || yaInstalada || recienInstalada) return null;

  async function instalar() {
    if (aviso) {
      await aviso.prompt();
      const { outcome } = await aviso.userChoice;
      consumirAvisoInstalacion();
      if (outcome === "accepted") setRecienInstalada(true);
      return;
    }
    setGuia(true);
  }

  async function abrirCompartir() {
    try {
      await navigator.share({ title: "Lamelas", url: window.location.origin });
    } catch {
      // El usuario cerró el menú o el navegador no lo soporta: quedan los pasos.
    }
  }

  return (
    <>
      <Button type="button" onClick={instalar} className={className}>
        <Download />
        Instalar app
      </Button>

      <Dialog open={guia} onOpenChange={setGuia}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar la app</DialogTitle>
            <DialogDescription>
              {ios
                ? "En iPhone la app se agrega desde el menú Compartir. Son dos toques."
                : "Tu navegador no ofrece instalar desde un botón. Seguí estos pasos."}
            </DialogDescription>
          </DialogHeader>

          {ios ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Share className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  Tocá <strong>Compartir</strong> (el cuadrado con la flecha, abajo en Safari o
                  arriba en Chrome).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <SquarePlus className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  Bajá y elegí <strong>Agregar a inicio</strong>. Dejá prendido &quot;Abrir como app&quot;
                  y tocá <strong>Agregar</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  Abrí <strong>Lamelas</strong> desde el ícono nuevo, entrá a{" "}
                  <strong>Mi perfil</strong> y activá las notificaciones.
                </span>
              </li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Abrí el panel en Chrome (Android) o Safari (iPhone).</li>
              <li>
                Desde el menú del navegador elegí <strong>Instalar app</strong> o{" "}
                <strong>Agregar a la pantalla de inicio</strong>.
              </li>
              <li>Abrí la app desde el ícono y activá las notificaciones en Mi perfil.</li>
            </ol>
          )}

          {ios && typeof navigator !== "undefined" && "share" in navigator && (
            <Button type="button" variant="outline" onClick={abrirCompartir}>
              <Share />
              Abrir el menú Compartir
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
