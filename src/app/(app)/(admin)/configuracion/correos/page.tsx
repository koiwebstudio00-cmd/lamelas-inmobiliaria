import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { CorreosForm } from "@/components/settings/correos-form";
import { getCorreosConfig, getCorreosRecientes, type CorreoReciente } from "@/lib/queries";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Correos — Lamelas & Chaumont" };

const ESTADO: Record<CorreoReciente["estado"], { label: string; clase: string }> = {
  pendiente: { label: "En cola", clase: "bg-amber-100 text-amber-900" },
  enviando: { label: "Enviando", clase: "bg-amber-100 text-amber-900" },
  enviado: { label: "Enviado", clase: "bg-green-100 text-green-800" },
  fallido: { label: "Falló", clase: "bg-red-100 text-red-800" },
};

export default async function CorreosPage() {
  const [config, recientes] = await Promise.all([getCorreosConfig(), getCorreosRecientes()]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Correos</h1>
        <p className="text-sm text-muted-foreground">
          Qué avisos llegan también por correo electrónico, además de la campanita.
        </p>
      </div>

      <section className="border bg-background">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
          <Mail className="size-5 text-primary" />
          <h2 className="font-semibold">Correos activos</h2>
        </div>
        <CorreosForm config={config} />
      </section>

      <section className="border bg-background">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
          <Send className="size-5 text-primary" />
          <h2 className="font-semibold">Últimos envíos</h2>
        </div>
        {recientes.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no salió ningún correo.</p>
        ) : (
          <ul className="divide-y">
            {recientes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0 space-y-0.5">
                  {c.lead_id ? (
                    <Link href={`/consultas/${c.lead_id}`} prefetch={false} className="font-medium hover:underline">
                      {c.asunto}
                    </Link>
                  ) : (
                    <p className="font-medium">{c.asunto}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Para {c.destinatario} · {formatDateTime(c.enviado_at ?? c.created_at)}
                  </p>
                  {c.error && c.estado !== "enviado" && (
                    <p className="text-xs text-destructive">
                      {c.estado === "fallido" ? "No se pudo enviar" : `Reintentando (${c.intentos})`}: {c.error}
                    </p>
                  )}
                </div>
                <span className={cn("shrink-0 px-2 py-0.5 text-xs font-medium", ESTADO[c.estado].clase)}>
                  {ESTADO[c.estado].label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
