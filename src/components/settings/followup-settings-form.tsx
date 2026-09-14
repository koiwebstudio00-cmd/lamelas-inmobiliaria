"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveFollowupSettings, type FollowupSettingsState } from "@/actions/followups";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FollowupSettings } from "@/lib/queries";

export function FollowupSettingsForm({ settings }: { settings: FollowupSettings }) {
  const [state, formAction, pending] = useActionState<FollowupSettingsState, FormData>(
    saveFollowupSettings,
    {}
  );

  return (
    <form action={formAction} className="space-y-5 p-4">
      <div className="flex items-start justify-between gap-4 border p-3 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5">
        <div className="space-y-0.5">
          <Label htmlFor="followup-enabled">Activar seguimiento automático</Label>
          <p id="followup-enabled-description" className="text-muted-foreground">
            Sofi vuelve a escribir a las 2 y 4 horas. Si no hay respuesta, a las
            6 horas marca el lead como fantasma y lo asigna a un vendedor.
          </p>
        </div>
        <Switch
          id="followup-enabled"
          name="enabled"
          value="on"
          defaultChecked={settings.enabled}
          aria-describedby="followup-enabled-description"
          className="mt-0.5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="first-message">Primer seguimiento · después de 2 horas</Label>
        <Textarea
          id="first-message"
          name="first_message"
          defaultValue={settings.firstMessage}
          maxLength={1000}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="second-message">Último seguimiento · 2 horas más tarde</Label>
        <Textarea
          id="second-message"
          name="second_message"
          defaultValue={settings.secondMessage}
          maxLength={1000}
          required
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        <Save /> {pending ? "Guardando..." : "Guardar seguimiento"}
      </Button>
    </form>
  );
}
