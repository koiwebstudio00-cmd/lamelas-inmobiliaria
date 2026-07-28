"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid, Table2 } from "lucide-react";
import { setVista } from "@/actions/vista";
import { cn } from "@/lib/utils";
import type { Vista } from "@/lib/vista";

const OPCIONES = [
  { valor: "tabla", label: "Tabla", icon: Table2 },
  { valor: "cards", label: "Cards", icon: LayoutGrid },
] as const;

/**
 * Selector de vista de las listas. Dos botones en vez de un menú: son dos
 * opciones y conviene que se vea cuál está puesta sin abrir nada.
 */
export function VistaToggle({ vista }: { vista: Vista }) {
  const pathname = usePathname();
  const [pendiente, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="Vista de la lista"
      className={cn("flex border", pendiente && "opacity-60")}
    >
      {OPCIONES.map((o) => {
        const activa = vista === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={activa}
            disabled={pendiente || activa}
            onClick={() => startTransition(() => setVista(o.valor, pathname))}
            className={cn(
              "flex h-9 items-center gap-1.5 px-3 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              activa
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <o.icon className="size-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
