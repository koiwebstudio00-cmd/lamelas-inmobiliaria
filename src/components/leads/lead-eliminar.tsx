"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteLead } from "@/actions/leads";

/** Botón de borrado con confirmación. Solo se renderiza para admin (lo decide la página). */
export function LeadEliminar({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function eliminar() {
    setError(null);
    startTransition(async () => {
      // En éxito, la action hace redirect a /consultas; solo vuelve si falló.
      const err = await deleteLead(leadId);
      if (err) setError(err);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          <Trash2 /> Eliminar consulta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta consulta?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran también la conversación con el agente, sus mensajes y las notas internas.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          {/* Botón propio (no AlertDialogAction) para no cerrar el diálogo antes
              de que termine la acción y poder mostrar un error si falla. */}
          <Button variant="destructive" disabled={pending} onClick={eliminar}>
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
