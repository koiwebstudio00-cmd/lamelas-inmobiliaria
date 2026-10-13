"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { guardarCorreoActivo } from "@/actions/correos";
import type { CorreosActivos, TipoCorreo } from "@/lib/queries";

const TIPOS: { tipo: TipoCorreo; titulo: string; descripcion: string }[] = [
  {
    tipo: "lead_asignado",
    titulo: "Te asignaron una consulta",
    descripcion:
      "Al vendedor que recibe una consulta (derivación del agente, reasignación, vencimiento o formulario del sitio). Trae el teléfono, el link de WhatsApp y un botón para abrirla en el panel.",
  },
];

/** Un interruptor por tipo de correo. Se guarda al tocarlo. */
export function CorreosForm({ config }: { config: CorreosActivos }) {
  const [valores, setValores] = useState(config);
  const [pending, startTransition] = useTransition();

  function cambiar(tipo: TipoCorreo, activo: boolean) {
    const anterior = valores[tipo];
    setValores((v) => ({ ...v, [tipo]: activo }));
    startTransition(async () => {
      const error = await guardarCorreoActivo({ tipo, activo });
      if (error) {
        setValores((v) => ({ ...v, [tipo]: anterior }));
        toast.error(error);
        return;
      }
      toast.success(activo ? "Correo activado" : "Correo desactivado");
    });
  }

  return (
    <div className="space-y-3 p-4">
      {TIPOS.map((t) => (
        <div
          key={t.tipo}
          className="flex items-start justify-between gap-4 border p-3 text-sm has-data-[state=checked]:bg-primary/5"
        >
          <div className="space-y-0.5">
            <Label htmlFor={`correo-${t.tipo}`}>{t.titulo}</Label>
            <p id={`correo-${t.tipo}-desc`} className="text-muted-foreground">
              {t.descripcion}
            </p>
          </div>
          <Switch
            id={`correo-${t.tipo}`}
            checked={valores[t.tipo]}
            disabled={pending}
            onCheckedChange={(v) => cambiar(t.tipo, v)}
            aria-describedby={`correo-${t.tipo}-desc`}
            className="mt-0.5"
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Los correos de cuenta (invitaciones y contraseñas) se envían siempre. Los demás avisos
        quedan solo en la campanita del panel.
      </p>
    </div>
  );
}
