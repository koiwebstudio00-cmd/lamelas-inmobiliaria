"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { borrarAdjunto } from "@/actions/feedback";
import type { FeedbackAdjunto } from "@/lib/types";

/**
 * Galería de imágenes de un reporte. Cada thumbnail abre la imagen completa en
 * otra pestaña. Si `puedeEliminar`, muestra un botón para borrar cada una.
 */
export function AdjuntosGallery({
  feedbackId,
  adjuntos,
  puedeEliminar,
}: {
  feedbackId: string;
  adjuntos: FeedbackAdjunto[];
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (adjuntos.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin imágenes.</p>;
  }

  function eliminar(id: string) {
    setError(null);
    startTransition(async () => {
      const err = await borrarAdjunto(id, feedbackId);
      if (err) setError(err);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {adjuntos.map((a) => (
          <li key={a.id} className="group relative">
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt="Captura del reporte"
                className="aspect-video w-full border object-cover"
              />
            </a>
            {puedeEliminar && (
              <button
                type="button"
                onClick={() => eliminar(a.id)}
                disabled={pending}
                aria-label="Eliminar imagen"
                className="absolute right-1 top-1 flex size-6 items-center justify-center bg-background/90 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
