"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLead, type LeadFormState } from "@/actions/leads";

/**
 * Alta manual de una consulta: alguien llamó, escribió por WhatsApp o pasó por
 * la oficina. La API la marca con canal "manual" y la asigna a quien la carga.
 */
export function NewLeadForm({
  propiedades,
}: {
  propiedades: { id: string; titulo: string }[];
}) {
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(
    createLead,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre de quien consulta</Label>
        <Input id="nombre" name="nombre" autoComplete="off" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="off" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Con uno de los dos alcanza, pero hace falta alguna forma de responder.
      </p>

      <div className="space-y-2">
        <Label htmlFor="property_id">Propiedad por la que consulta (opcional)</Label>
        <Select id="property_id" name="property_id" defaultValue="">
          <option value="">Ninguna en particular</option>
          {propiedades.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje">De qué se trata</Label>
        <Textarea id="mensaje" name="mensaje" required />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando..." : "Guardar consulta"}
      </Button>
    </form>
  );
}
