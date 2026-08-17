import Link from "next/link";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CLIENTES_EJEMPLO } from "@/lib/clientes-mock";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Clientes — Lamelas & Chaumont" };

export default function ClientesPage() {
  const clientes = CLIENTES_EJEMPLO;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Las personas que compraron o alquilaron con la inmobiliaria.
        </p>
      </div>

      {/* Aviso: esta es la vista previa del módulo, con datos de muestra. */}
      <div className="flex items-start gap-3 border border-dashed bg-muted/40 p-4 text-sm">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Vista previa con datos de ejemplo</p>
          <p className="text-muted-foreground">
            Estamos armando el módulo de clientes. Los datos de abajo son de
            muestra para que veas cómo va a quedar. Pronto vas a poder registrar
            un cliente a partir de una consulta ganada y llevar el historial de
            lo que compró o alquiló con la inmobiliaria.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <Users className="size-5 text-primary" />
          <CardTitle className="text-base">Clientes ({clientes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clientes/${c.id}`}
                        prefetch={false}
                        className="hover:text-primary hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.contacto}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {c.propiedades.length > 1
                          ? "Venta y alquiler"
                          : c.propiedades[0]?.rol === "vende"
                            ? "Venta"
                            : "Alquiler"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[18rem] truncate text-muted-foreground">
                      {c.propiedades[0]?.titulo ?? "Sin propiedades"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                      {formatDate(c.alta)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/clientes/${c.id}`} prefetch={false}>
                          Ver <ArrowRight />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
