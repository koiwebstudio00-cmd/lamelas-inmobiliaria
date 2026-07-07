"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { updateEstado } from "@/actions/properties";
import { ESTADOS, type EstadoPropiedad } from "@/lib/types";

export function EstadoSelect({
  propertyId,
  estado,
}: {
  propertyId: string;
  estado: EstadoPropiedad;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef}>
      <Select
        name="estado"
        defaultValue={estado}
        disabled={pending}
        aria-label="Estado de la propiedad"
        className="h-9 w-36 text-sm"
        onChange={() => {
          const formData = new FormData(formRef.current!);
          startTransition(async () => {
            await updateEstado(propertyId, formData);
            toast.success("Estado actualizado");
          });
        }}
      >
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </Select>
    </form>
  );
}
