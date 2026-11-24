import { createProperty } from "@/actions/properties";
import { PropertyForm } from "@/components/properties/property-form";
import { getCurrentUser } from "@/lib/api";
import { getEdificios, getProperty, getVendedores } from "@/lib/queries";

export const metadata = { title: "Nueva captación — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function NuevaPropiedadPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // `?desde=<id>`: alta de otra unidad a partir de una propiedad existente
  // (misma torre, mismas características). Se copian los datos, no las fotos.
  const { desde } = await searchParams;
  const [edificios, origen, me] = await Promise.all([
    getEdificios(),
    desde ? getProperty(desde) : Promise.resolve(null),
    getCurrentUser(),
  ]);
  // El admin puede cargar a nombre de otro vendedor (FORM-UNICO-01).
  const esAdmin = me?.rol === "admin" || me?.rol === "super_admin";
  const vendedores = esAdmin ? await getVendedores() : [];
  // Lo que distingue a cada unidad arranca vacío; el estado, disponible. Los
  // datos internos (llaves, propietario) no se copian: son de cada unidad.
  const plantilla = origen
    ? {
        ...origen.property,
        unidad: null,
        estado: "disponible" as const,
        datos_internos: null,
        faltantes: [],
      }
    : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">Nueva captación</h1>
      {plantilla ? (
        <p className="border border-primary/30 bg-primary/5 p-3 text-sm">
          Copiamos los datos de <strong>{origen!.property.titulo}</strong>
          {plantilla.edificio ? ` (${plantilla.edificio.nombre})` : ""}. Cambiá lo que sea
          distinto en esta unidad — al menos la <strong>unidad</strong> y el precio — y cargá
          sus fotos.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Completá lo marcado con <span className="text-destructive">*</span> para publicarla. Si te
          falta algo, guardala como borrador y terminala después.
        </p>
      )}
      {/* Sin tarjeta envolvente: cada sección del formulario es su propia tarjeta. */}
      <div>
        <PropertyForm
          // `key`: al pasar de una plantilla a otra el form se rearma entero.
          key={desde ?? "nueva"}
          action={createProperty}
          plantilla={plantilla}
          edificios={edificios}
          esAdmin={esAdmin}
          vendedores={vendedores}
          usuarioId={me?.id}
        />
      </div>
    </div>
  );
}
