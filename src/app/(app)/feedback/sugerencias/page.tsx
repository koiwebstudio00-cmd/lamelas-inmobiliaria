import { Suspense } from "react";
import Link from "next/link";
import { Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackFilters } from "@/components/feedback/feedback-filters";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { Pagination } from "@/components/pagination";
import { getFeedbackList } from "@/lib/queries";

export const metadata = { title: "Sugerencias — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function SugerenciasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { items, count, page } = await getFeedbackList({
    tipo: "sugerencia",
    estado: params.estado,
    q: params.q,
    pagina: params.pagina ? Number(params.pagina) : 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Sugerencias</h1>
          <p className="text-sm text-muted-foreground">Ideas para mejorar el sistema. {count} en total.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/feedback/sugerencias/nueva" prefetch={false}>
            <Plus /> Nueva sugerencia
          </Link>
        </Button>
      </div>

      <Suspense>
        <FeedbackFilters />
      </Suspense>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <Lightbulb className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay sugerencias todavía</p>
          <p className="text-sm text-muted-foreground">
            Cuando alguien proponga una mejora, va a aparecer acá.
          </p>
        </div>
      ) : (
        <FeedbackList items={items} />
      )}

      <Pagination page={page} count={count} basePath="/feedback/sugerencias" searchParams={params} />
    </div>
  );
}
