import { notFound, redirect } from "next/navigation";
import { updateProperty } from "@/actions/properties";
import { PropertyForm } from "@/components/properties/property-form";
import { PhotoManager } from "@/components/properties/photo-manager";
import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyImage } from "@/lib/types";

export const metadata = { title: "Editar propiedad — Lamelas & Chaumont" };

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: property }, { data: images }, { data: userData }] =
    await Promise.all([
      supabase.from("properties").select("*").eq("id", id).single<Property>(),
      supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id)
        .order("es_portada", { ascending: false })
        .order("orden"),
      supabase.auth.getUser(),
    ]);

  if (!property) notFound();
  // RLS ya bloquea el update ajeno; esto solo evita mostrar el form (HU-5)
  if (property.user_id !== userData.user?.id) redirect(`/propiedades/${id}`);

  const action = updateProperty.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Editar propiedad</h1>
      <div className="border bg-background p-4">
        <PhotoManager propertyId={property.id} images={(images ?? []) as PropertyImage[]} />
      </div>
      <div className="border bg-background p-4 sm:p-6">
        <PropertyForm action={action} property={property} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
