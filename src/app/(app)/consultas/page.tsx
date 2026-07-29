import { Suspense } from "react";
import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadRow } from "@/components/leads/lead-row";
import { LeadTable } from "@/components/leads/lead-table";
import { Pagination } from "@/components/pagination";
import { VistaToggle } from "@/components/vista-toggle";
import { getCurrentUser } from "@/lib/api";
import { getLeads, getVendedores } from "@/lib/queries";
import { getVista } from "@/lib/vista";

export const metadata = { title: "Consultas — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const me = await getCurrentUser();
  const esAdmin = me?.rol === "admin" || me?.rol === "super_admin";

  const [{ leads, count, page }, vendedores, vista] = await Promise.all([
    getLeads({
      q: params.q,
      estado: params.estado,
      canal: params.canal,
      asignado: params.asignado,
      pagina: params.pagina ? Number(params.pagina) : 1,
    }),
    esAdmin ? getVendedores() : Promise.resolve([]),
    getVista(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Consultas</h1>
          <p className="text-sm text-muted-foreground">
            {esAdmin
              ? "Todo lo que entra por el sitio y lo que carga el equipo."
              : "Las consultas asignadas a vos y las de tus propiedades."}{" "}
            {count} en total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VistaToggle vista={vista} />
          <Button asChild size="sm">
            <Link href="/consultas/nueva" prefetch={false}>
              <Plus /> Cargar consulta
            </Link>
          </Button>
        </div>
      </div>

      <Suspense>
        <LeadFilters vendedores={vendedores} puedeFiltrarPorVendedor={esAdmin} />
      </Suspense>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay consultas para mostrar</p>
          <p className="text-sm text-muted-foreground">
            Cuando alguien escriba desde el sitio público, va a aparecer acá.
          </p>
        </div>
      ) : vista === "tabla" ? (
        <LeadTable leads={leads} />
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </ul>
      )}

      <Pagination page={page} count={count} basePath="/consultas" searchParams={params} />
    </div>
  );
}
