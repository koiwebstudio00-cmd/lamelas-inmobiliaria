"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Buscador por dirección/barrio/tipo y el corte "Todas / Mías". */
export function CaptacionesFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mias = searchParams.get("mias") === "1";

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

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por dirección, barrio o tipo"
          className="pl-9"
          aria-label="Buscar captaciones"
        />
      </div>
      <div className="flex border bg-background p-1" role="tablist" aria-label="Qué captaciones ver">
        {[
          ["", "Todas"],
          ["1", "Mías"],
        ].map(([valor, label]) => {
          const activo = (valor === "1") === mias;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setParam("mias", valor)}
              className={cn(
                "min-h-9 flex-1 px-4 text-sm sm:flex-none",
                activo ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
