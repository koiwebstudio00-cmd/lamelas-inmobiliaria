"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Building2,
  CirclePause,
  CirclePlay,
  ExternalLink,
  Handshake,
  ListChecks,
  MessageSquareText,
  Search,
  Settings2,
  Wrench
} from "lucide-react";
import { toast } from "sonner";
import { setAgentEnabled } from "@/actions/followups";
import { FollowupSettingsForm } from "@/components/settings/followup-settings-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FollowupSettings } from "@/lib/queries";

type Tab = "followups" | "behavior" | "tools";

const TABS: Array<{ id: Tab; label: string; icon: typeof Settings2 }> = [
  { id: "followups", label: "Seguimientos", icon: MessageSquareText },
  { id: "behavior", label: "Comportamiento", icon: Settings2 },
  { id: "tools", label: "Herramientas", icon: Wrench }
];

const BEHAVIOR = [
  {
    title: "Forma de responder",
    description: "Habla de manera cercana, breve y rioplatense, en uno, dos o tres mensajes cortos."
  },
  {
    title: "Uso de información",
    description: "Responde con datos públicos del inventario y no inventa precios, disponibilidad ni condiciones."
  },
  {
    title: "Búsqueda y calificación",
    description: "Averigua la necesidad de forma conversacional y conserva presupuesto, zonas y detalles útiles."
  },
  {
    title: "Derivación a personas",
    description: "Deriva visitas, reservas, tasaciones, pedidos humanos y consultas que no puede resolver con certeza."
  }
];

const TOOLS = [
  {
    name: "Buscar propiedades",
    icon: Search,
    description: "Busca opciones reales aplicando operación, tipo, zona, presupuesto y características."
  },
  {
    name: "Identificar propiedad",
    icon: Building2,
    description: "Reconoce una publicación por dirección, título, identificador, slug o enlace propio."
  },
  {
    name: "Ver propiedad",
    icon: ExternalLink,
    description: "Recupera los datos actualizados y el enlace de una propiedad ya identificada."
  },
  {
    name: "Derivar a vendedor",
    icon: Handshake,
    description: "Asigna la conversación a un vendedor y le entrega el contexto reunido por Sofi."
  }
];

function ReadOnlyBadge() {
  return <Badge variant="secondary">Solo lectura</Badge>;
}

export function AgentSettingsPanel({
  settings,
  connectedNumbers
}: {
  settings: FollowupSettings;
  connectedNumbers: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("followups");
  const [pending, startTransition] = useTransition();
  const operational = settings.agentEnabled && connectedNumbers > 0;

  function changeAgentStatus(enabled: boolean) {
    startTransition(async () => {
      const error = await setAgentEnabled(enabled);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(enabled ? "Sofi quedó encendida." : "Sofi quedó apagada para todos los chats.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center border",
                operational ? "border-primary/30 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <Bot className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Estado del agente</h2>
                <Badge variant={operational ? "default" : "secondary"}>
                  {!settings.agentEnabled
                    ? "Apagado"
                    : connectedNumbers > 0
                      ? "Operativo"
                      : "Sin número conectado"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {!settings.agentEnabled
                  ? "Sofi no responderá mensajes nuevos en ninguna conversación."
                  : connectedNumbers > 0
                    ? `Sofi está atendiendo en ${connectedNumbers} número${connectedNumbers === 1 ? "" : "s"} de WhatsApp.`
                    : "Sofi está encendida, pero necesita un número de WhatsApp activo para recibir mensajes."}
              </p>
            </div>
          </div>

          {settings.agentEnabled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={pending}>
                  <CirclePause /> Apagar agente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Apagar a Sofi en todas las conversaciones?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dejará de responder mensajes nuevos y se cancelarán los seguimientos pendientes.
                    Las conversaciones y sus mensajes no se borran.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => changeAgentStatus(false)}>
                    Apagar agente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={() => changeAgentStatus(true)} disabled={pending}>
              <CirclePlay /> {pending ? "Encendiendo..." : "Encender agente"}
            </Button>
          )}
        </div>
      </section>

      <section className="border bg-background">
        <div
          role="tablist"
          aria-label="Secciones de ajustes del agente"
          className="flex overflow-x-auto border-b bg-muted/30"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${item.id}`}
                id={`tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-w-max items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-background text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "followups" ? (
          <div role="tabpanel" id="panel-followups" aria-labelledby="tab-followups">
            <div className="border-b px-4 py-3">
              <h3 className="font-semibold">Seguimiento de leads por WhatsApp</h3>
              <p className="text-xs text-muted-foreground">
                Los plazos corren de forma continua, incluso fuera del horario de atención.
              </p>
            </div>
            <FollowupSettingsForm settings={settings} />
          </div>
        ) : tab === "behavior" ? (
          <div
            role="tabpanel"
            id="panel-behavior"
            aria-labelledby="tab-behavior"
            className="space-y-4 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">Comportamiento actual</h3>
                <p className="text-sm text-muted-foreground">
                  Reglas principales con las que Sofi conversa y decide cuándo derivar.
                </p>
              </div>
              <ReadOnlyBadge />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BEHAVIOR.map((item) => (
                <article key={item.title} className="border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ListChecks className="size-4 text-primary" />
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div
            role="tabpanel"
            id="panel-tools"
            aria-labelledby="tab-tools"
            className="space-y-4 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">Herramientas habilitadas</h3>
                <p className="text-sm text-muted-foreground">
                  Acciones que Sofi puede ejecutar mientras atiende una conversación.
                </p>
              </div>
              <ReadOnlyBadge />
            </div>
            <div className="divide-y border">
              {TOOLS.map((tool) => (
                <article key={tool.name} className="flex items-start gap-3 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center bg-primary/10 text-primary">
                    <tool.icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{tool.name}</h4>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
