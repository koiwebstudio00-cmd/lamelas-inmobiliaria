import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { EliminarCaptacion } from "@/components/captaciones/eliminar-captacion";
import { MensajeAcciones } from "@/components/captaciones/mensaje-acciones";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/api";
import { esAdmin } from "@/lib/permisos";
import { getCaptacion } from "@/lib/queries";
import { formatDateTime, imageUrl } from "@/lib/utils";

export const metadata = { title: "Captación — Lamelas & Chaumont" };

export default async function CaptacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [captacion, me] = await Promise.all([getCaptacion(id), getCurrentUser()]);
  if (!captacion) notFound();
  const puedeEditar = Boolean(me && (captacion.autor.id === me.id || esAdmin(me.rol)));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/captaciones" prefetch={false}>
          <ChevronLeft /> Captaciones
        </Link>
      </Button>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Alquiler · {captacion.tipo}</p>
        <h1 className="text-2xl font-semibold">{captacion.direccion}</h1>
        <p className="text-sm text-muted-foreground">
          {[captacion.barrio, captacion.localidad].filter(Boolean).join(", ")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {captacion.responsable && <>Responsable: {captacion.responsable.nombre} · </>}
          Cargó {captacion.autor.nombre} el {formatDateTime(captacion.created_at)}
          {captacion.updated_at !== captacion.created_at && <> · editada {formatDateTime(captacion.updated_at)}</>}
        </p>
      </div>

      <section className="rounded-xl space-y-3 border bg-background p-4">
        <h2 className="text-sm font-semibold">Mensaje para el grupo</h2>
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words bg-muted/40 p-3 font-mono text-[13px] leading-relaxed">
          {captacion.mensaje}
        </pre>
        <MensajeAcciones mensaje={captacion.mensaje} />
      </section>

      {captacion.imagenes.length > 0 && (
        <section className="rounded-xl space-y-3 border bg-background p-4">
          <h2 className="text-sm font-semibold">
            Fotos <span className="font-normal text-muted-foreground">({captacion.imagenes.length})</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {captacion.imagenes.map((foto, i) => (
              <a
                key={foto.id}
                href={imageUrl(foto.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-[4/3] overflow-hidden rounded-md border bg-muted"
              >
                <Image
                  src={imageUrl(foto.url)}
                  alt={`Foto ${i + 1} de la captación`}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {puedeEditar && (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/captaciones/${captacion.id}/editar`} prefetch={false}>
              <Pencil /> Editar
            </Link>
          </Button>
          <EliminarCaptacion id={captacion.id} />
        </div>
      )}
    </div>
  );
}
