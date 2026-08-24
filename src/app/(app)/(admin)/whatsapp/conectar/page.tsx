import { TriangleAlert } from "lucide-react";
import { ChannelManager } from "@/components/whatsapp/channel-manager";
import { getChannels } from "@/lib/queries";

export const metadata = { title: "Conectar número — Lamelas & Chaumont" };

/**
 * `?error=` lo escribe la pantalla de callback cuando Zernio no pudo confirmar
 * la conexión, para que el mensaje se vea acá y no en una pantalla intermedia
 * que el usuario ya dejó atrás.
 */
export default async function ConectarWhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; conectado?: string }>;
}) {
  const [cuentas, params] = await Promise.all([getChannels(), searchParams]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Conectar número</h1>
        <p className="text-sm text-muted-foreground">
          El número de WhatsApp por el que Sofi atiende a los clientes. Se
          conecta autorizando a Meta una sola vez.
        </p>
      </div>

      {params.error && (
        <div className="flex items-start gap-2 border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm">{params.error}</p>
        </div>
      )}

      {params.conectado && !params.error && (
        <div className="border border-primary/30 bg-primary/5 p-3 text-sm">
          Listo, el número quedó conectado. Sofi ya recibe los mensajes que
          lleguen ahí.
        </div>
      )}

      <ChannelManager cuentas={cuentas} />

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          Al tocar «Conectar WhatsApp» se abre la autorización de Meta: ahí se
          elige la cuenta de WhatsApp Business y el número. Meta puede pedir
          antes la verificación del negocio, un trámite suyo que tarda algunos
          días y que no depende de este panel.
        </p>
        <p>
          «Verificar» le pregunta a Zernio si el número sigue respondiendo — sirve
          para saber si Sofi dejó de contestar porque se cayó la conexión o por
          otro motivo. Para probar a Sofi sin usar WhatsApp, está{" "}
          <strong>Probar agente</strong>, acá al lado en el menú.
        </p>
      </div>
    </div>
  );
}
