"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateDestacada } from "@/actions/properties";

/** Botón rápido para prender/apagar el destacado desde el detalle. */
export function DestacarButton({
  propertyId,
  destacada,
}: {
  propertyId: string;
  destacada: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={destacada ? "default" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const error = await updateDestacada(propertyId, !destacada);
          if (error) toast.error(error);
          else toast.success(destacada ? "Se quitó el destacado." : "Propiedad destacada.");
        });
      }}
      className={destacada ? "bg-amber-400 text-amber-950 hover:bg-amber-500" : undefined}
    >
      <Star className={destacada ? "fill-current" : undefined} />
      {destacada ? "Destacada" : "Destacar"}
    </Button>
  );
}
