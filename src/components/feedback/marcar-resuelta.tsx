"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cambiarEstadoFeedback } from "@/actions/feedback";

/** Para quien publicó: dar por resuelto lo suyo. El resto de los estados es del admin. */
export function MarcarResuelta({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const err = await cambiarEstadoFeedback(id, "resuelta");
            if (err) setError(err);
            else router.refresh();
          });
        }}
      >
        <CheckCircle2 /> {pending ? "Guardando..." : "Marcar como resuelto"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
