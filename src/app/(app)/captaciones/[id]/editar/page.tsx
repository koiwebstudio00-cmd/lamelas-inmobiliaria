import { notFound, redirect } from "next/navigation";
import { CaptacionForm } from "@/components/captaciones/captacion-form";
import { getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import { getCaptacion, getVendedores } from "@/lib/queries";

export const metadata = { title: "Editar captación — Lamelas & Chaumont" };

export default async function EditarCaptacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, captacion, vendedores] = await Promise.all([getCurrentUser(), getCaptacion(id), getVendedores()]);
  if (!me) redirect("/login");
  if (!captacion) notFound();
  // Cosmética: la API rechaza igual a quien no es el autor ni admin.
  if (captacion.autor.id !== me.id && !esAdmin(me.rol)) redirect(`/captaciones/${id}`);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Editar captación</h1>
        <p className="text-sm text-muted-foreground">{captacion.direccion}</p>
      </div>
      <CaptacionForm
        vendedores={vendedores}
        responsableInicial={captacion.datos.responsable_id}
        inicial={{ id: captacion.id, datos: captacion.datos, mensaje: captacion.mensaje }}
      />
    </div>
  );
}
