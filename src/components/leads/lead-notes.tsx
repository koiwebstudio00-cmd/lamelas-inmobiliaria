"use client";

import { useActionState, useEffect, useRef } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addLeadNote, type LeadFormState } from "@/actions/leads";
import { formatDateTime } from "@/lib/utils";
import type { LeadNota } from "@/lib/types";

export function LeadNotes({ leadId, notas }: { leadId: string; notas: LeadNota[] }) {
  const action = addLeadNote.bind(null, leadId);
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Vaciar el campo recién cuando la nota se guardó de verdad.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea
          name="nota"
          placeholder="Anotá qué se habló, qué quedó pendiente..."
          aria-label="Nueva nota interna"
          className="min-h-[80px]"
          required
        />
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          <MessageSquarePlus /> {pending ? "Guardando..." : "Agregar nota"}
        </Button>
      </form>

      {notas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay notas. Son internas: solo las ve el equipo.
        </p>
      ) : (
        <ul className="space-y-3">
          {notas.map((n) => (
            <li key={n.id} className="border-l-2 border-primary/40 pl-3">
              <p className="whitespace-pre-wrap text-sm">{n.nota}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.autor ?? "—"} · {formatDateTime(n.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
