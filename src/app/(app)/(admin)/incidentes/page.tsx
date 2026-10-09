import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { GravedadBadge, INCIDENTE_TIPO_LABELS } from "@/components/incidents/incident-meta";
import { Pagination } from "@/components/pagination";
import { RefreshButton } from "@/components/refresh-button";
import { getIncidentes } from "@/lib/queries";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

export const metadata = { title: "Incidentes del agente — Lamelas & Chaumont" };

type SearchParams = Promise<Record<string, string | undefined>>;

const VISTAS = [
  { valor: undefined, label: "Abiertos" },
  { valor: "resueltos", label: "Resueltos" },
  { valor: "todos", label: "Todos" },
] as const;

export default async function IncidentesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ver = params.ver === "resueltos" || params.ver === "todos" ? params.ver : undefined;
  const soloCriticos = params.gravedad === "critica";
  const { incidentes, count, page, abiertos, criticosAbiertos } = await getIncidentes({
    estado: ver === "todos" ? undefined : ver === "resueltos" ? "resuelto" : "abierto",
    gravedad: soloCriticos ? "critica" : undefined,
    pagina: params.pagina ? Number(params.pagina) : 1,
  });

  const href = (cambios: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { ver, gravedad: soloCriticos ? "critica" : undefined, ...cambios };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const qs = q.toString();
    return qs ? `/incidentes?${qs}` : "/incidentes";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Incidentes del agente</h1>
          <p className="text-sm text-muted-foreground">
            {abiertos === 0
              ? "Todo en orden: no hay incidentes abiertos."
              : `${abiertos} abiertos${criticosAbiertos > 0 ? `, ${criticosAbiertos} críticos` : ""}.`}
          </p>
        </div>
        <RefreshButton label="Actualizar incidentes" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2 border-b">
        <div className="flex gap-1">
          {VISTAS.map((v) => {
            const activo = ver === v.valor;
            return (
              <Link
                key={v.label}
                href={href({ ver: v.valor, pagina: undefined })}
                prefetch={false}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
                  activo
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
        <Link
          href={href({ gravedad: soloCriticos ? undefined : "critica", pagina: undefined })}
          prefetch={false}
          aria-pressed={soloCriticos}
          className={cn(
            "mb-1.5 border px-2 py-1 text-xs font-medium",
            soloCriticos
              ? "border-red-700 bg-red-600 text-white"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          Solo críticos
        </Link>
      </div>

      {incidentes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed bg-background p-12 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {ver === "resueltos" || ver === "todos" ? "No hay incidentes para mostrar" : "No hay incidentes abiertos"}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Acá aparecen los errores del agente de WhatsApp: fallas en n8n, n8n caído y la cuenta de
            WhatsApp desconectada. Los críticos también llegan a la campanita.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {incidentes.map((i) => (
            <li key={i.id}>
              <Link
                href={`/incidentes/${i.id}`}
                prefetch={false}
                className={cn(
                  "flex items-start gap-3 border bg-background p-4 hover:bg-accent/40",
                  i.estado === "abierto" && i.gravedad === "critica" && "shadow-[inset_4px_0_0_var(--color-red-600)]"
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <GravedadBadge incidente={i} />
                    <span className="text-xs text-muted-foreground">{INCIDENTE_TIPO_LABELS[i.tipo]}</span>
                  </div>
                  <p className="font-medium leading-snug">{i.titulo}</p>
                  {i.nodo && (
                    <p className="truncate text-sm text-muted-foreground">
                      Nodo: <span className="font-mono">{i.nodo}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {i.ocurrencias > 1 ? `${i.ocurrencias} veces · ` : ""}
                    última {formatRelative(i.ultima_at)} · desde {formatDateTime(i.primera_at)}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} count={count} basePath="/incidentes" searchParams={params} />
    </div>
  );
}
