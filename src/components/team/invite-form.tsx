"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { inviteUser, type TeamState } from "@/actions/team";
import { ROLES } from "@/lib/types";

export function InviteForm() {
  const [state, formAction, pending] = useActionState<TeamState, FormData>(inviteUser, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nombre@ejemplo.com"
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rol">Rol</Label>
          <Select id="rol" name="rol" defaultValue="agente" className="sm:w-48">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        <Send /> {pending ? "Enviando..." : "Enviar invitación"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Le llega un mail con un link para elegir su contraseña. El link vence a
        los 7 días.
      </p>
    </form>
  );
}
