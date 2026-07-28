import { createProperty } from "@/actions/properties";
import { PropertyForm } from "@/components/properties/property-form";

export const metadata = { title: "Nueva propiedad — Lamelas & Chaumont" };

export default function NuevaPropiedadPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Nueva propiedad</h1>
      <p className="text-sm text-muted-foreground">
        Solo título, operación, tipo y precio son obligatorios. Las fotos las
        podés agregar acá mismo o después desde el detalle.
      </p>
      <div className="border bg-background p-4 sm:p-6">
        <PropertyForm action={createProperty} submitLabel="Crear propiedad" />
      </div>
    </div>
  );
}
