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
// verde disponible · amarillo reservado/proximamente · gris pausado · azul
// vendida/alquilada · oscuro privado (no se publica)
const ESTADO_STYLES: Record<EstadoPropiedad, string> = {
  disponible: "bg-[var(--estado-disponible-bg)] text-[var(--estado-disponible-fg)]",
  reservado: "bg-[var(--estado-reservada-bg)] text-[var(--estado-reservada-fg)]",
  proximamente: "bg-[var(--estado-reservada-bg)] text-[var(--estado-reservada-fg)]",
  pausado: "bg-muted text-muted-foreground",
  vendida: "bg-[var(--estado-vendida-bg)] text-[var(--estado-vendida-fg)]",
  alquilada: "bg-[var(--estado-vendida-bg)] text-[var(--estado-vendida-fg)]",
  privado: "bg-foreground text-background",
  borrador: "border border-dashed border-amber-500 bg-amber-50 text-amber-900",
};

const ESTADO_LABELS: Record<EstadoPropiedad, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  proximamente: "Próximamente",
  pausado: "Pausado",
  vendida: "Vendida",
  alquilada: "Alquilada",
  privado: "Privado",
  borrador: "Borrador",
};

function EstadoBadge({
  estado,
  className,
  children,
}: {
  estado: EstadoPropiedad;
  className?: string;
  /** Texto en lugar de la etiqueta del estado (ej. "Borrador · faltan 3 datos"). */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
        ESTADO_STYLES[estado],
        className
      )}
    >
      {children ?? ESTADO_LABELS[estado]}
    </div>
  );
}

export { Badge, badgeVariants, EstadoBadge };
