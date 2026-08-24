import { ProbarAgente } from "@/components/agente/probar-agente";
import { getConversacionesPrueba } from "@/lib/queries";

export const metadata = { title: "Probar agente — Lamelas & Chaumont" };

export default async function ProbarAgentePage() {
  const conversaciones = await getConversacionesPrueba();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Probar agente</h1>
        <p className="text-sm text-muted-foreground">
          Conversá con Sofi como si fueras un visitante del sitio, sin usar WhatsApp. Estas charlas
          quedan aparte de las consultas reales (se identifican por su sesión con prefijo{" "}
          <code>prueba-</code>).
        </p>
      </div>
      <ProbarAgente conversaciones={conversaciones} />
    </div>
  );
}
