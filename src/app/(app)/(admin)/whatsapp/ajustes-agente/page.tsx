import { AgentSettingsPanel } from "@/components/whatsapp/agent-settings-panel";
import { getChannels, getFollowupSettings } from "@/lib/queries";

export const metadata = { title: "Ajustes del agente — Lamelas & Chaumont" };

export default async function AgentSettingsPage() {
  const [settings, channels] = await Promise.all([
    getFollowupSettings(),
    getChannels()
  ]);
  const connectedNumbers = channels.filter((channel) => channel.estado === "activa").length;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes del agente</h1>
        <p className="text-sm text-muted-foreground">
          Estado, seguimientos y capacidades de Sofi para las conversaciones de WhatsApp.
        </p>
      </div>

      <AgentSettingsPanel settings={settings} connectedNumbers={connectedNumbers} />
    </div>
  );
}
