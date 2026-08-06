import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReporteForm } from "@/components/feedback/reporte-form";

export const metadata = { title: "Reportar un error — Lamelas & Chaumont" };

export default function NuevoReportePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/feedback/reportes" prefetch={false}>
          <ArrowLeft /> Volver a reportes
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Reportar un error</h1>
        <p className="text-sm text-muted-foreground">
          Contanos qué encontraste. Podés adjuntar capturas para que se entienda mejor.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <ReporteForm />
        </CardContent>
      </Card>
    </div>
  );
}
