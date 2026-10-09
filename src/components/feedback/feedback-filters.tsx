"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ESTADOS_FEEDBACK, TIPOS_FEEDBACK } from "@/lib/types";

/** Buscador + filtros por tipo (pestañas) y estado del canal de feedback. */
export function FeedbackFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== q) setParam("q", q);
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = ["q", "estado"].some((k) => searchParams.get(k));
  const tipoActual = searchParams.get("tipo") ?? "";
  const pestañas = [{ value: "", label: "Todo" }, ...TIPOS_FEEDBACK];

  return (
    <div className="space-y-2">
      <div role="tablist" aria-label="Tipo" className="flex gap-1 overflow-x-auto border-b">
        {pestañas.map((t) => {
          const activa = tipoActual === t.value;
          return (
            <button
              key={t.value || "todo"}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setParam("tipo", t.value)}
              className={cn(
                "-mb-px whitespace-nowrap px-3 py-2 text-sm font-medium",
                activa
                  ? "text-primary shadow-[inset_0_-2px_0_var(--color-primary)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título o descripción..."
          className="pl-9"
          aria-label="Buscar"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          aria-label="Estado"
          value={searchParams.get("estado") ?? ""}
          onChange={(e) => setParam("estado", e.target.value)}
          className="h-9 max-w-56 text-sm"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_FEEDBACK.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              router.replace(tipoActual ? `${pathname}?tipo=${tipoActual}` : pathname);
            }}
          >
            <X /> Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
