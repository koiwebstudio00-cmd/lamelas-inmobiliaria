import { notFound, redirect } from "next/navigation";
import { updateProperty } from "@/actions/properties";
import { PropertyForm } from "@/components/properties/property-form";
import { PhotoManager } from "@/components/properties/photo-manager";
import { getCurrentUser } from "@/lib/api";
import { getProperty } from "@/lib/queries";

export const metadata = { title: "Editar propiedad — Lamelas & Chaumont" };

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, me] = await Promise.all([getProperty(id), getCurrentUser()]);

  if (!detail) notFound();

  const { property, images } = detail;
  // La API ya bloquea el update ajeno; esto solo evita mostrar el form (HU-5)
  if (property.user_id !== me?.id) redirect(`/propiedades/${id}`);

  const action = updateProperty.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Editar propiedad</h1>
      <div className="border bg-background p-4">
        <PhotoManager propertyId={property.id} images={images} />
      </div>
      <div className="border bg-background p-4 sm:p-6">
        <PropertyForm action={action} property={property} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
