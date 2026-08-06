import { Suspense } from "react";
import Link from "next/link";
import { Bug, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackFilters } from "@/components/feedback/feedback-filters";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { Pagination } from "@/components/pagination";
import { getFeedbackList } from "@/lib/queries";

export const metadata = { title: "Reportes de error — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function ReportesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { items, count, page } = await getFeedbackList({
    tipo: "error",
    estado: params.estado,
    q: params.q,
    pagina: params.pagina ? Number(params.pagina) : 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Reportes de error</h1>
          <p className="text-sm text-muted-foreground">Errores que reportaron los usuarios. {count} en total.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/feedback/reportes/nuevo" prefetch={false}>
            <Plus /> Reportar un error
          </Link>
        </Button>
      </div>

      <Suspense>
        <FeedbackFilters />
      </Suspense>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <Bug className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay reportes todavía</p>
          <p className="text-sm text-muted-foreground">
            Si encontrás un error en el sistema, reportalo desde acá.
          </p>
        </div>
      ) : (
        <FeedbackList items={items} />
      )}

      <Pagination page={page} count={count} basePath="/feedback/reportes" searchParams={params} />
    </div>
  );
}
