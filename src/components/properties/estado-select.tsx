"use client";

import { useState, useTransition } from "react";
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
  // Controlado: si la API rechaza el cambio (ej. sacar de borrador una
  // propiedad incompleta, 422), el select vuelve al estado que tenía.
  const [valor, setValor] = useState<EstadoPropiedad>(estado);

  return (
    <Select
      name="estado"
      value={valor}
      disabled={pending}
      aria-label="Estado de la propiedad"
      className="h-9 w-36 text-sm"
      onChange={(ev) => {
        const anterior = valor;
        const nuevo = ev.target.value as EstadoPropiedad;
        setValor(nuevo);
        const formData = new FormData();
        formData.set("estado", nuevo);
        startTransition(async () => {
          const error = await updateEstado(propertyId, formData);
          if (error) {
            setValor(anterior);
            toast.error(error);
          } else toast.success("Estado actualizado");
        });
      }}
    >
      {ESTADOS.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </Select>
  );
}
