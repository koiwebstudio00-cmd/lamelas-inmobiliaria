"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CANALES, CLASIFICACIONES, ESTADOS_LEAD } from "@/lib/types";

export function LeadFilters({
  vendedores,
  puedeFiltrarPorVendedor,
}: {
  vendedores: { id: string; nombre: string }[];
  /** Un vendedor solo ve lo suyo: el filtro por asignado no le aporta nada. */
  puedeFiltrarPorVendedor: boolean;
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

  const hasFilters = [
    "q",
    "estado",
    "canal",
    "clasificacion",
    "atencion",
    "avance",
    "sin_tomar",
    "cierre",
    "asignado",
  ].some((k) => searchParams.get(k));

  // "Sin tomar", "Atención" y "Esperando avance" son pendientes distintos de
  // la misma bandeja: comparten un solo select para no sumar otra columna.
  const pendiente = searchParams.get("sin_tomar") === "true"
    ? "sin_tomar"
    : searchParams.get("atencion") === "true"
      ? "atencion"
      : searchParams.get("avance") === "pendiente"
        ? "avance"
        : "";

  function setPendiente(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("atencion");
    params.delete("avance");
    params.delete("sin_tomar");
    if (value === "sin_tomar") params.set("sin_tomar", "true");
    if (value === "atencion") params.set("atencion", "true");
    if (value === "avance") params.set("avance", "pendiente");
    params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`);
  }

  // El estado y el cierre también van juntos: "Ganada · Venta" es un estado
  // más fino, no otro eje.
  const estadoValor = searchParams.get("cierre")
    ? `ganada:${searchParams.get("cierre")}`
    : (searchParams.get("estado") ?? "");

  function setEstado(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("estado");
    params.delete("cierre");
    if (value.startsWith("ganada:")) {
      params.set("estado", "ganada");
      params.set("cierre", value.slice("ganada:".length));
    } else if (value) params.set("estado", value);
    params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="pl-9"
          aria-label="Buscar consultas"
        />
      </div>
      <div
        className={
          puedeFiltrarPorVendedor
            ? "grid grid-cols-2 gap-2 sm:grid-cols-5"
            : "grid grid-cols-2 gap-2 sm:grid-cols-4"
        }
      >
        <Select
          aria-label="Pendientes"
          value={pendiente}
          onChange={(e) => setPendiente(e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Pendientes</option>
          <option value="sin_tomar">Sin tomar</option>
          <option value="atencion">Necesita atención</option>
          <option value="avance">Esperando avance</option>
        </Select>
        <Select
          aria-label="Estado"
          value={estadoValor}
          onChange={(e) => setEstado(e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Estado</option>
          {ESTADOS_LEAD.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
          <option value="ganada:venta">Ganada · Venta</option>
          <option value="ganada:alquiler">Ganada · Alquiler</option>
        </Select>
        <Select
          aria-label="Canal"
          value={searchParams.get("canal") ?? ""}
          onChange={(e) => setParam("canal", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Canal</option>
          {CANALES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Clasificación"
          value={searchParams.get("clasificacion") ?? ""}
          onChange={(e) => setParam("clasificacion", e.target.value)}
          className="h-9 text-sm"
        >
          <option value="">Clasificación</option>
          {CLASIFICACIONES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        {puedeFiltrarPorVendedor && (
          <Select
            aria-label="Asignada a"
            value={searchParams.get("asignado") ?? ""}
            onChange={(e) => setParam("asignado", e.target.value)}
            className="h-9 text-sm"
          >
            <option value="">Asignada a</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </Select>
        )}
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
