import { createClient } from "@/lib/supabase/server";
import type { PropertyCardData } from "@/components/properties/property-card";
import type { EstadoPropiedad, Operacion, TipoPropiedad } from "@/lib/types";

export const PAGE_SIZE = 24;

export interface PropertyFilters {
  q?: string;
  operacion?: string;
  tipo?: string;
  estado?: string;
  vendedor?: string;
  pagina?: number;
  userId?: string;
}

interface PropertyRow {
  id: string;
  titulo: string;
  operacion: Operacion;
  tipo: TipoPropiedad;
  precio: number;
  moneda: "ARS" | "USD";
  estado: EstadoPropiedad;
  zona: string | null;
  user_id: string;
  users: { nombre: string } | null;
  property_images: { url: string; es_portada: boolean }[];
}

export async function getProperties(filters: PropertyFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.pagina ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("properties")
    .select(
      "id, titulo, operacion, tipo, precio, moneda, estado, zona, user_id, users(nombre), property_images(url, es_portada)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filters.operacion) query = query.eq("operacion", filters.operacion as Operacion);
  if (filters.tipo) query = query.eq("tipo", filters.tipo as TipoPropiedad);
  if (filters.estado) query = query.eq("estado", filters.estado as EstadoPropiedad);
  if (filters.vendedor) query = query.eq("user_id", filters.vendedor);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.q) {
    const term = filters.q.replaceAll("%", "\\%").replaceAll(",", " ");
    query = query.or(`titulo.ilike.%${term}%,direccion.ilike.%${term}%`);
  }

  const { data, count } = await query;

  const properties: PropertyCardData[] = ((data as unknown as PropertyRow[]) ?? []).map(
    (p) => ({
      id: p.id,
      titulo: p.titulo,
      operacion: p.operacion,
      tipo: p.tipo,
      precio: p.precio,
      moneda: p.moneda,
      estado: p.estado,
      zona: p.zona,
      vendedor: p.users?.nombre ?? null,
      portada:
        p.property_images.find((i) => i.es_portada)?.url ??
        p.property_images[0]?.url ??
        null,
    })
  );

  return { properties, count: count ?? 0, page };
}

export async function getVendedores() {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("id, nombre").order("nombre");
  return data ?? [];
}
