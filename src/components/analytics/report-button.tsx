import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Elige el mes y abre el reporte mensual imprimible. Es un GET común: el
 * reporte es una página del panel y se guarda como PDF desde el navegador.
 */
export function ReportButton({ defaultMonth, maxMonth }: { defaultMonth: string; maxMonth: string }) {
  return (
    <form action="/analiticas/reporte" className="flex items-center gap-1 border bg-background p-1">
      <label className="sr-only" htmlFor="report-month">Mes del reporte</label>
      <Input
        id="report-month"
        type="month"
        name="mes"
        defaultValue={defaultMonth}
        max={maxMonth}
        required
        className="h-8 w-40"
      />
      <Button type="submit" size="sm">
        <FileDown className="size-4" /> Reporte mensual
      </Button>
    </form>
  );
}
