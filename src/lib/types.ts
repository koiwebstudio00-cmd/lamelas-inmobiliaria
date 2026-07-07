// Tipos de la BD. Regenerar con:
// npx supabase gen types typescript --linked > src/lib/types.ts
// (versión manual equivalente a supabase/migrations/0001_init.sql)

export type Operacion = "venta" | "alquiler";
export type TipoPropiedad = "casa" | "departamento" | "terreno" | "local" | "otro";
export type Moneda = "ARS" | "USD";
export type EstadoPropiedad = "disponible" | "reservada" | "vendida";

export type UserProfile = {
  id: string;
  tenant_id: string;
  nombre: string;
  email: string;
  created_at: string;
}

export type Property = {
  id: string;
  tenant_id: string;
  user_id: string;
  titulo: string;
  operacion: Operacion;
  tipo: TipoPropiedad;
  precio: number;
  moneda: Moneda;
  descripcion: string | null;
  direccion: string | null;
  zona: string | null;
  ciudad: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  sup_cubierta: number | null;
  sup_total: number | null;
  estado: EstadoPropiedad;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  es_portada: boolean;
  orden: number;
  created_at: string;
}

type PropertyInsert = Pick<
  Property,
  "user_id" | "titulo" | "operacion" | "tipo" | "precio"
> &
  Partial<Omit<Property, "tenant_id" | "created_at" | "updated_at">>;

type PropertyUpdate = Partial<Omit<Property, "id" | "tenant_id" | "user_id" | "created_at">>;

type ImageInsert = Omit<PropertyImage, "id" | "created_at"> &
  Partial<Pick<PropertyImage, "id" | "es_portada" | "orden">>;

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: { id: string; nombre: string; created_at: string };
        Insert: { id?: string; nombre: string };
        Update: { nombre?: string };
        Relationships: [];
      };
      users: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at" | "tenant_id">;
        Update: Partial<Pick<UserProfile, "nombre">>;
        Relationships: [];
      };
      properties: {
        Row: Property;
        Insert: PropertyInsert;
        Update: PropertyUpdate;
        Relationships: [];
      };
      property_images: {
        Row: PropertyImage;
        Insert: ImageInsert;
        Update: Partial<Pick<PropertyImage, "es_portada" | "orden">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      operacion: Operacion;
      tipo_propiedad: TipoPropiedad;
      moneda: Moneda;
      estado_propiedad: EstadoPropiedad;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Constantes para UI
export const OPERACIONES: { value: Operacion; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

export const TIPOS: { value: TipoPropiedad; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "terreno", label: "Terreno" },
  { value: "local", label: "Local" },
  { value: "otro", label: "Otro" },
];

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

export const ESTADOS: { value: EstadoPropiedad; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];
