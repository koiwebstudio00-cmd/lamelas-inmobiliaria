import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SugerenciaForm } from "@/components/feedback/sugerencia-form";

export const metadata = { title: "Nueva sugerencia — Lamelas & Chaumont" };

export default function NuevaSugerenciaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/feedback/sugerencias" prefetch={false}>
          <ArrowLeft /> Volver a sugerencias
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Nueva sugerencia</h1>
        <p className="text-sm text-muted-foreground">Contanos qué mejorarías del sistema.</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <SugerenciaForm />
        </CardContent>
      </Card>
    </div>
  );
}
