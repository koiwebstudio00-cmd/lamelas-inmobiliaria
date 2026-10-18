import { redirect } from "next/navigation";
import { CaptacionForm } from "@/components/captaciones/captacion-form";
import { getCurrentUser } from "@/lib/api";
import { getVendedores } from "@/lib/queries";

export const metadata = { title: "Nueva captación — Lamelas & Chaumont" };

export default async function NuevaCaptacionPage() {
  const [me, vendedores] = await Promise.all([getCurrentUser(), getVendedores()]);
  if (!me) redirect("/login");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Carga de alquiler</h1>
        <p className="text-sm text-muted-foreground">Completá los cuatro pasos y el mensaje para el grupo sale listo.</p>
      </div>
      <CaptacionForm vendedores={vendedores} responsableInicial={vendedores.some((v) => v.id === me.id) ? me.id : ""} />
    </div>
  );
}
