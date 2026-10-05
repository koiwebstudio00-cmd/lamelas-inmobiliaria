"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { LeadCierreDialog, type CierreInicial } from "@/components/leads/lead-cierre-dialog";
import { Select } from "@/components/ui/select";
import { updateLeadEstado } from "@/actions/leads";
import { formatDate } from "@/lib/utils";
import { ESTADOS_LEAD, type EstadoLead, type OperacionCierre } from "@/lib/types";

const OPERACION_LABEL: Record<OperacionCierre, string> = { venta: "Venta", alquiler: "Alquiler" };

/**
 * Etapa comercial de la consulta. "Ganada" no se guarda directo: abre el
 * diálogo de cierre para registrar si fue venta o alquiler y con qué propiedad.
 */
export function LeadEstadoSelect({
  leadId,
  estado,
  cierre,
  propiedadConsultada,
}: {
  leadId: string;
  estado: EstadoLead;
  /** Datos del cierre si ya está ganada. */
  cierre: {
    operacion: OperacionCierre | null;
    propiedad: { id: string; titulo: string } | null;
    cerrado_at: string | null;
  };
  /** La propiedad por la que consultó: propuesta por defecto al cerrar. */
  propiedadConsultada: { id: string; titulo: string; operacion?: string } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [dialogo, setDialogo] = useState(false);
  // El select es controlado: si se cancela el diálogo vuelve al estado real.
  const [valor, setValor] = useState<EstadoLead>(estado);
  const [origen, setOrigen] = useState(estado);
  if (origen !== estado) {
    setOrigen(estado);
    setValor(estado);
  }

  const yaGanada = estado === "ganada";
  const sugerida =
    propiedadConsultada?.operacion === "venta" || propiedadConsultada?.operacion === "alquiler"
      ? propiedadConsultada.operacion
      : null;
  const inicial: CierreInicial = yaGanada
    ? { operacion: cierre.operacion, propiedad: cierre.propiedad }
    : {
        operacion: sugerida,
        propiedad: propiedadConsultada
          ? { id: propiedadConsultada.id, titulo: propiedadConsultada.titulo }
          : null,
      };

  return (
    <div className="space-y-2">
      <Select
        value={valor}
        disabled={pending}
        aria-label="Estado de la consulta"
        className="h-9 text-sm"
        onChange={(e) => {
          const value = e.target.value as EstadoLead;
          if (value === "ganada") {
            setDialogo(true);
            return;
          }
          setValor(value);
          startTransition(async () => {
            const error = await updateLeadEstado(leadId, value);
            if (error) {
              toast.error(error);
              setValor(estado);
            } else toast.success("Estado actualizado");
          });
        }}
      >
        {ESTADOS_LEAD.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </Select>

      {yaGanada && (
        <div className="flex items-start justify-between gap-2 border border-[var(--lead-ganada-fg)]/20 bg-[var(--lead-ganada-bg)] px-3 py-2 text-[var(--lead-ganada-fg)]">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {cierre.operacion ? OPERACION_LABEL[cierre.operacion] : "Falta indicar: ¿venta o alquiler?"}
            </p>
            <p className="truncate text-xs">
              {cierre.propiedad?.titulo ?? "Sin propiedad cargada"}
              {cierre.cerrado_at ? ` · ${formatDate(cierre.cerrado_at)}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialogo(true)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
          >
            <Pencil className="size-3" /> {cierre.operacion ? "Editar" : "Completar"}
          </button>
        </div>
      )}

      {/* `key`: cada apertura arranca con los valores actuales, no con lo que
          quedó tipeado en una apertura anterior que se canceló. */}
      <LeadCierreDialog
        key={`${dialogo}-${cierre.operacion}-${cierre.propiedad?.id}`}
        leadId={leadId}
        open={dialogo}
        onOpenChange={setDialogo}
        inicial={inicial}
        yaGanada={yaGanada}
      />
    </div>
  );
}
