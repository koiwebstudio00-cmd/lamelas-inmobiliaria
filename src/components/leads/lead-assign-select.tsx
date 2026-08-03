"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { assignLead } from "@/actions/leads";

/**
 * Reasignar es solo de admin. La pantalla ni siquiera monta este componente
 * para un vendedor, pero si llegara a hacerlo la API responde 403 igual.
 */
export function LeadAssignSelect({
  leadId,
  assignedTo,
  vendedores,
}: {
  leadId: string;
  assignedTo: string | null;
  vendedores: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={assignedTo ?? ""}
      disabled={pending}
      aria-label="Vendedor asignado"
      className="h-9 text-sm"
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          const error = await assignLead(leadId, value);
          if (error) toast.error(error);
          else toast.success(value ? "Consulta reasignada" : "Consulta sin asignar");
        });
      }}
    >
      <option value="">Sin asignar</option>
      {vendedores.map((v) => (
        <option key={v.id} value={v.id}>
          {v.nombre}
        </option>
      ))}
    </Select>
  );
}
