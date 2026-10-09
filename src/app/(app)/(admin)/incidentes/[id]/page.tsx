import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  GravedadBadge,
  INCIDENTE_AYUDA,
  INCIDENTE_TIPO_LABELS,
} from "@/components/incidents/incident-meta";
import { ResolveIncidentButton } from "@/components/incidents/resolve-button";
import { Button } from "@/components/ui/button";
import { getIncidente } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Incidente — Lamelas & Chaumont" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function IncidentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const incidente = await getIncidente(id);
  if (!incidente) notFound();

  const datos: [string, React.ReactNode][] = [
    ["Tipo", INCIDENTE_TIPO_LABELS[incidente.tipo]],
    ["Primera vez", formatDateTime(incidente.primera_at)],
    ["Última vez", formatDateTime(incidente.ultima_at)],
    ["Veces", incidente.ocurrencias],
  ];
  if (incidente.workflow) datos.push(["Workflow", <span key="w" className="font-mono">{incidente.workflow}</span>]);
  if (incidente.nodo) datos.push(["Nodo", <span key="n" className="font-mono">{incidente.nodo}</span>]);
  if (incidente.estado === "resuelto" && incidente.resuelto_at) {
    datos.push([
      "Resuelto",
      `${formatDateTime(incidente.resuelto_at)} · ${
        incidente.resuelto_por ? `por ${incidente.resuelto_por.nombre}` : "se resolvió solo"
      }`,
    ]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/incidentes" prefetch={false}>
          <ArrowLeft /> Incidentes
        </Link>
      </Button>

      <div className="space-y-2">
        <GravedadBadge incidente={incidente} />
        <h1 className="text-2xl font-semibold leading-tight">{incidente.titulo}</h1>
      </div>

      <section className="border bg-background p-4 text-sm">
        <h2 className="mb-1 font-semibold">Qué significa</h2>
        <p className="text-muted-foreground">{INCIDENTE_AYUDA[incidente.tipo]}</p>
        <p className="mt-2 text-muted-foreground">Si no tenés acceso a n8n o a Zernio, avisale a Koi.</p>
      </section>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border bg-background p-4 text-sm sm:grid-cols-[auto_1fr]">
        {datos.map(([label, valor]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{valor}</dd>
          </div>
        ))}
      </dl>

      {incidente.detalle && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold">Detalle del error</h2>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border bg-muted p-3 font-mono text-xs">
            {incidente.detalle}
          </pre>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {incidente.execution_url && (
          <Button asChild variant="outline" size="sm">
            <a href={incidente.execution_url} target="_blank" rel="noopener noreferrer">
              Ver la ejecución en n8n <ExternalLink />
            </a>
          </Button>
        )}
        {incidente.estado === "abierto" && <ResolveIncidentButton id={incidente.id} />}
      </div>
    </div>
  );
}
