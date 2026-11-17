"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { FiltrosPlegables } from "@/components/filtros-plegables";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OPERACIONES, TIPOS, ESTADOS, MONEDAS } from "@/lib/types";

// Filtros que cuentan como "aplicados" (la búsqueda va aparte).
const FILTROS = [
  "operacion",
  "tipo",
  "estado",
  "vendedor",
  "edificio",
  "dormitorios",
  "precio_min",
  "precio_max",
  "moneda",
  "zona_revisar",
];

export function PropertyFilters({
  vendedores,
  edificios = [],
}: {
  vendedores: { id: string; nombre: string }[];
  /** Con al menos un edificio cargado se suma el filtro por edificio. */
  edificios?: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [precioMin, setPrecioMin] = useState(searchParams.get("precio_min") ?? "");
  const [precioMax, setPrecioMax] = useState(searchParams.get("precio_max") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncePrecio = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Rango de precio con debounce: un solo replace con los dos valores.
  useEffect(() => {
    if (debouncePrecio.current) clearTimeout(debouncePrecio.current);
    debouncePrecio.current = setTimeout(() => {
      const minActual = searchParams.get("precio_min") ?? "";
      const maxActual = searchParams.get("precio_max") ?? "";
      if (minActual === precioMin && maxActual === precioMax) return;
      const params = new URLSearchParams(searchParams.toString());
      if (precioMin) params.set("precio_min", precioMin);
      else params.delete("precio_min");
      if (precioMax) params.set("precio_max", precioMax);
      else params.delete("precio_max");
      params.delete("pagina");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => {
      if (debouncePrecio.current) clearTimeout(debouncePrecio.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioMin, precioMax]);

  const precioInvertido =
    precioMin !== "" && precioMax !== "" && Number(precioMin) > Number(precioMax);

  const activos = FILTROS.filter((k) => searchParams.get(k)).length;
  const hasFilters = activos > 0 || Boolean(searchParams.get("q"));

  return (
    <FiltrosPlegables
      activos={activos}
      busqueda={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título o dirección..."
              className="h-11 pl-9 sm:h-9"
              aria-label="Buscar"
            />
          </div>
      }
      gridClassName={
          // Con el filtro de edificio son seis selects: una columna más en escritorio.
          edificios.length > 0
            ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
            : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      }
      extra={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Precio</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                placeholder="Mínimo"
                aria-label="Precio mínimo"
                className="h-11 w-32 text-base sm:h-9 sm:w-28 sm:text-sm"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                placeholder="Máximo"
                aria-label="Precio máximo"
                className="h-11 w-32 text-base sm:h-9 sm:w-28 sm:text-sm"
              />
              <Select
                aria-label="Moneda del precio"
                value={searchParams.get("moneda") ?? ""}
                onChange={(e) => setParam("moneda", e.target.value)}
                className="h-11 w-36 text-base sm:h-9 sm:w-32 sm:text-sm"
              >
                <option value="">Cualquier moneda</option>
                {MONEDAS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
              {precioInvertido && (
                <span className="text-xs text-destructive">El mínimo es mayor que el máximo.</span>
              )}
            </div>
            <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={searchParams.get("zona_revisar") === "true"}
                onChange={(ev) => setParam("zona_revisar", ev.target.checked ? "true" : "")}
              />
              Solo zonas a revisar
            </label>
          </div>
      }
      onLimpiar={
        hasFilters
          ? () => {
              setQ("");
              setPrecioMin("");
              setPrecioMax("");
              router.replace(pathname);
            }
          : undefined
      }
    >

        <Select
          aria-label="Operación"
          value={searchParams.get("operacion") ?? ""}
          onChange={(e) => setParam("operacion", e.target.value)}
          className="h-11 text-base sm:h-9 sm:text-sm"
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
          className="h-11 text-base sm:h-9 sm:text-sm"
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
          className="h-11 text-base sm:h-9 sm:text-sm"
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
          className="h-11 text-base sm:h-9 sm:text-sm"
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
          className="h-11 text-base sm:h-9 sm:text-sm"
        >
          <option value="">Vendedor</option>
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </Select>
        {edificios.length > 0 && (
          <Select
            aria-label="Edificio"
            value={searchParams.get("edificio") ?? ""}
            onChange={(e) => setParam("edificio", e.target.value)}
            className="h-11 text-base sm:h-9 sm:text-sm"
          >
            <option value="">Edificio</option>
            {edificios.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.nombre}
              </option>
            ))}
          </Select>
        )}
    </FiltrosPlegables>
  );
}
