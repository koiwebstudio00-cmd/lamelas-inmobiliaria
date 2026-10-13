"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { closeLeadGanada, fetchPropiedadesParaCierre } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { OPERACIONES_CIERRE, type OperacionCierre } from "@/lib/types";

export type CierreInicial = {
  operacion: OperacionCierre | null;
  propiedad: { id: string; titulo: string } | null;
};

const ESTADO_PROPIEDAD: Record<OperacionCierre, string> = {
  venta: "vendida",
  alquiler: "alquilada",
};

/**
 * Cierre de una consulta ganada: qué se concretó y con qué propiedad. La
 * operación es obligatoria — es justo el dato que antes no quedaba registrado
 * y por eso no se podían separar ventas de alquileres.
 */
export function LeadCierreDialog({
  leadId,
  open,
  onOpenChange,
  inicial,
  yaGanada,
}: {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inicial: CierreInicial;
  /** true = se está corrigiendo un cierre existente, no ganando la consulta. */
  yaGanada: boolean;
}) {
  const [operacion, setOperacion] = useState<OperacionCierre | null>(inicial.operacion);
  const [propiedadId, setPropiedadId] = useState(inicial.propiedad?.id ?? "");
  const [marcar, setMarcar] = useState(!yaGanada);
  const [opciones, setOpciones] = useState<{ id: string; titulo: string }[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [pending, startTransition] = useTransition();

  // La consultada siempre está entre las opciones, aunque ya no esté disponible.
  const lista = [
    ...(inicial.propiedad ? [inicial.propiedad] : []),
    ...(opciones ?? []).filter((p) => p.id !== inicial.propiedad?.id),
  ];

  async function cargarOpciones() {
    if (opciones || cargando) return;
    setCargando(true);
    setOpciones(await fetchPropiedadesParaCierre());
    setCargando(false);
  }

  function confirmar() {
    if (!operacion) {
      toast.error("Indicá si fue una venta o un alquiler.");
      return;
    }
    startTransition(async () => {
      const res = await closeLeadGanada(leadId, {
        operacion,
        propiedadId,
        marcarPropiedad: marcar && propiedadId !== "",
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      onOpenChange(false);
      const label = operacion === "venta" ? "Venta" : "Alquiler";
      if (res.propiedadMarcada === false) {
        toast.warning(
          `Consulta ganada (${label}). No pudimos cambiar el estado de la propiedad porque es de otro vendedor: pedile a un admin que la marque como ${ESTADO_PROPIEDAD[operacion]}.`
        );
      } else {
        toast.success(`Consulta ganada · ${label}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{yaGanada ? "Datos del cierre" : "Cerrar consulta como ganada"}</DialogTitle>
          <DialogDescription>
            Indicá qué se concretó. Con esto las métricas separan ventas de alquileres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">¿Qué se concretó?</legend>
            <div className="grid grid-cols-2 gap-2">
              {OPERACIONES_CIERRE.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={operacion === o.value}
                  onClick={() => setOperacion(o.value)}
                  className={cn(
                    "h-11 border text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    operacion === o.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="cierre-propiedad">Propiedad</Label>
            <Select
              id="cierre-propiedad"
              value={propiedadId}
              onChange={(e) => setPropiedadId(e.target.value)}
              // Las demás propiedades se piden recién al abrir el selector.
              onFocus={cargarOpciones}
              onMouseDown={cargarOpciones}
              className="h-10 text-sm"
            >
              <option value="">Sin propiedad cargada en el sistema</option>
              {lista.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
              {cargando && <option disabled>Cargando propiedades...</option>}
            </Select>
            {inicial.propiedad && propiedadId === inicial.propiedad.id && (
              <p className="text-xs text-muted-foreground">Es la propiedad por la que consultó.</p>
            )}
          </div>

          {propiedadId !== "" && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={marcar}
                onChange={(e) => setMarcar(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                Marcar la propiedad como{" "}
                <strong>{operacion ? ESTADO_PROPIEDAD[operacion] : "vendida o alquilada"}</strong>
                <span className="block text-xs text-muted-foreground">
                  Deja de ofrecerse en el sitio y Martina no la sugiere más.
                </span>
              </span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={pending || !operacion} onClick={confirmar}>
            {pending ? "Guardando..." : yaGanada ? "Guardar cierre" : "Confirmar cierre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
