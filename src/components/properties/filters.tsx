"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OPERACIONES, TIPOS, ESTADOS } from "@/lib/types";

export function PropertyFilters({
  vendedores,
}: {
  vendedores: { id: string; nombre: string }[];
}) {
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

  // Búsqueda con debounce (HU-10)
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

  const hasFilters =
    ["q", "operacion", "tipo", "estado", "vendedor", "dormitorios"].some((k) =>
      searchParams.get(k)
    );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título o dirección..."
          className="pl-9"
          aria-label="Buscar"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Select
          aria-label="Operación"
          value={searchParams.get("operacion") ?? ""}
          onChange={(e) => setParam("operacion", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Operación</option>
          {OPERACIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Dormitorios"
          value={searchParams.get("dormitorios") ?? ""}
          onChange={(e) => setParam("dormitorios", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Dormitorios</option>
          <option value="1">1 dormitorio</option>
          <option value="2">2 dormitorios</option>
          <option value="3">3 dormitorios</option>
          <option value="4">4 o más</option>
        </Select>
        <Select
          aria-label="Tipo"
          value={searchParams.get("tipo") ?? ""}
          onChange={(e) => setParam("tipo", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Tipo</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Estado"
          value={searchParams.get("estado") ?? ""}
          onChange={(e) => setParam("estado", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Estado</option>
          {ESTADOS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Vendedor"
          value={searchParams.get("vendedor") ?? ""}
          onChange={(e) => setParam("vendedor", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Vendedor</option>
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </Select>
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.replace(pathname);
          }}
        >
          <X /> Limpiar filtros
        </Button>
      )}
    </div>
  );
}
