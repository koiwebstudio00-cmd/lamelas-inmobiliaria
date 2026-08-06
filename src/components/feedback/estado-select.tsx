"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { cambiarEstadoFeedback } from "@/actions/feedback";
import { ESTADOS_FEEDBACK, type FeedbackEstado } from "@/lib/types";

/** Cambio de estado (triaje). Solo se renderiza para admin/super_admin. */
export function FeedbackEstadoSelect({ id, estado }: { id: string; estado: FeedbackEstado }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Select
        aria-label="Estado"
        defaultValue={estado}
        disabled={pending}
        className="h-9 text-sm"
        onChange={(e) => {
          const nuevo = e.target.value as FeedbackEstado;
          setError(null);
          startTransition(async () => {
            const err = await cambiarEstadoFeedback(id, nuevo);
            if (err) setError(err);
            else router.refresh();
          });
        }}
      >
        {ESTADOS_FEEDBACK.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
