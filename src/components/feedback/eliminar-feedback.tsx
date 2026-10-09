"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { borrarFeedback } from "@/actions/feedback";

/** Borrado con confirmación. Solo se renderiza para admin/super_admin. */
export function EliminarFeedback({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function eliminar() {
    setError(null);
    startTransition(async () => {
      const err = await borrarFeedback(id);
      if (err) {
        setError(err);
        return;
      }
      router.push("/feedback");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 /> Eliminar publicación
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta publicación?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borra junto con sus imágenes y todas las respuestas. No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          {/* Botón propio (no AlertDialogAction) para poder mostrar el error sin
              cerrar el diálogo si la acción falla. */}
          <Button variant="destructive" disabled={pending} onClick={eliminar}>
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
