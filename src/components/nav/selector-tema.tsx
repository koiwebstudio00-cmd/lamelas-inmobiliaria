"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPCIONES = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Como el sistema", icon: Monitor },
] as const;

/** Botón de la barra superior para elegir el tema (TEMA-OSCURO-01). */
export function SelectorTema() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cambiar tema">
          {/* Los dos íconos se alternan por CSS: no dependen de leer el tema
              en el cliente, así no hay salto al hidratar. */}
          <Sun className="scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme ?? "light"} onValueChange={setTheme}>
          {OPCIONES.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              <o.icon className="size-4 text-muted-foreground" />
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
