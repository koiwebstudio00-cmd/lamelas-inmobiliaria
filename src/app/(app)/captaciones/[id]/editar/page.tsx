import { redirect } from "next/navigation";

// FORM-UNICO-01: las captaciones quedaron como historial de solo lectura.
export default async function EditarCaptacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/captaciones/${id}`);
}
