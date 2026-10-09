"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { resolveIncident } from "@/actions/incidents";
import { Button } from "@/components/ui/button";

export function ResolveIncidentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const error = await resolveIncident(id);
          if (error) toast.error(error);
          else toast.success("Incidente marcado como resuelto");
        })
      }
    >
      <Check /> {pending ? "Guardando..." : "Marcar resuelto"}
    </Button>
  );
}
