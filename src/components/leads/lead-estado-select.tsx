"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { updateLeadEstado } from "@/actions/leads";
import { ESTADOS_LEAD, type EstadoLead } from "@/lib/types";

export function LeadEstadoSelect({
  leadId,
  estado,
}: {
  leadId: string;
  estado: EstadoLead;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={estado}
      disabled={pending}
      aria-label="Estado de la consulta"
      className="h-9 text-sm"
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          const error = await updateLeadEstado(leadId, value);
          if (error) toast.error(error);
          else toast.success("Estado actualizado");
        });
      }}
    >
      {ESTADOS_LEAD.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </Select>
  );
}
