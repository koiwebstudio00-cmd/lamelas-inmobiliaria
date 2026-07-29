import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { getPropiedadesParaSelect } from "@/lib/queries";

export const metadata = { title: "Cargar consulta — Lamelas & Chaumont" };

export default async function NuevaConsultaPage() {
  const propiedades = await getPropiedadesParaSelect();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/consultas" prefetch={false}>
          <ArrowLeft /> Volver a consultas
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Cargar consulta</h1>
        <p className="text-sm text-muted-foreground">
          Para lo que entra por teléfono, WhatsApp o en la oficina. Queda asignada
          a vos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <NewLeadForm propiedades={propiedades} />
        </CardContent>
      </Card>
    </div>
  );
}
