import { Suspense } from "react";
import { MessagesSquare } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { FeedbackFeed } from "@/components/feedback/feedback-feed";
import { FeedbackFilters } from "@/components/feedback/feedback-filters";
import { NuevaPublicacion } from "@/components/feedback/nueva-publicacion";
import { Pagination } from "@/components/pagination";
import { getCurrentUser } from "@/lib/api";
import { getFeedbackList } from "@/lib/queries";

export const metadata = { title: "Feedback — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function FeedbackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [{ items, count, page }, me] = await Promise.all([
    getFeedbackList({
      tipo: params.tipo,
      estado: params.estado,
      q: params.q,
      pagina: params.pagina ? Number(params.pagina) : 1,
    }),
    getCurrentUser(),
  ]);
  const filtrando = Boolean(params.tipo || params.estado || params.q);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Errores, problemas e ideas del equipo. Todos lo ven y pueden responder.
        </p>
      </div>

      {me && <NuevaPublicacion userId={me.id} nombre={me.nombre} />}

      <Suspense>
        <FeedbackFilters />
      </Suspense>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
          <MessagesSquare className="size-8 text-muted-foreground" />
          <p className="font-medium">{filtrando ? "No hay nada con esos filtros" : "Todavía no hay publicaciones"}</p>
          <p className="text-sm text-muted-foreground">
            {filtrando
              ? "Probá con otro filtro o limpiá la búsqueda."
              : "Si algo no anda o se te ocurre una mejora, publicalo acá."}
          </p>
        </div>
      ) : (
        <FeedbackFeed items={items} now={new Date()} />
      )}

      <Pagination page={page} count={count} basePath="/feedback" searchParams={params} />
      <AutoRefresh />
    </div>
  );
}
