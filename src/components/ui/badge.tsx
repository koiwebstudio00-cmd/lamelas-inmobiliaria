import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { EstadoPropiedad } from "@/lib/types";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground border",
        outline: "border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Badge de estado de propiedad (design-system.md §3):
// verde disponible · amarillo reservada · azul vendida
const ESTADO_STYLES: Record<EstadoPropiedad, string> = {
  disponible: "bg-[var(--estado-disponible-bg)] text-[var(--estado-disponible-fg)]",
  reservada: "bg-[var(--estado-reservada-bg)] text-[var(--estado-reservada-fg)]",
  vendida: "bg-[var(--estado-vendida-bg)] text-[var(--estado-vendida-fg)]",
};

const ESTADO_LABELS: Record<EstadoPropiedad, string> = {
  disponible: "Disponible",
  reservada: "Reservada",
  vendida: "Vendida",
};

function EstadoBadge({ estado, className }: { estado: EstadoPropiedad; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
        ESTADO_STYLES[estado],
        className
      )}
    >
      {ESTADO_LABELS[estado]}
    </div>
  );
}

export { Badge, badgeVariants, EstadoBadge };
