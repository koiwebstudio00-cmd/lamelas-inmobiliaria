"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { updateLeadClasificacion } from "@/actions/leads";
import { CLASIFICACIONES, type ClasificacionLead } from "@/lib/types";

export function LeadClasificacionSelect({
  leadId,
  clasificacion,
}: {
  leadId: string;
  clasificacion: ClasificacionLead | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={clasificacion ?? ""}
      disabled={pending}
      aria-label="Clasificación de la consulta"
      className="h-9 text-sm"
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          const error = await updateLeadClasificacion(leadId, value);
          if (error) toast.error(error);
          else toast.success("Clasificación actualizada");
        });
      }}
    >
      <option value="">Sin clasificar</option>
      {CLASIFICACIONES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </Select>
  );
}
