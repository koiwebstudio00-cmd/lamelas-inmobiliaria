import { MessageSquareText } from "lucide-react";
import { MensajeAcciones } from "@/components/captaciones/mensaje-acciones";
import { mensajeGrupo } from "@/lib/mensaje-grupo";
import type { Property } from "@/lib/types";

/**
 * "Mensaje para el grupo" (FORM-UNICO-01): el texto que antes salía de la
 * captación, ahora armado desde la propiedad guardada. Copiar o abrir WhatsApp
 * para elegir el grupo. Se puede usar en cualquier momento, incluso en borrador.
 */
export function MensajeGrupo({
  property,
  responsable,
  aviso,
}: {
  property: Property;
  responsable: string | null;
  /** Texto chico debajo del título (ej. "Refleja lo último que guardaste"). */
  aviso?: string;
}) {
  const mensaje = mensajeGrupo(property, responsable);
  return (
    <section className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        <MessageSquareText className="size-5 text-primary" />
        <h2 className="flex-1 text-base font-semibold">Mensaje para el grupo</h2>
      </div>
      <div className="space-y-3 p-4">
        {aviso && <p className="text-xs text-muted-foreground">{aviso}</p>}
        <MensajeAcciones mensaje={mensaje} />
        <details className="group text-sm">
          <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
            Ver el texto
          </summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-sm">
            {mensaje}
          </pre>
        </details>
      </div>
    </section>
  );
}
