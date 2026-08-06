import { ProbarAgente } from "@/components/agente/probar-agente";

export const metadata = { title: "Probar agente — Lamelas & Chaumont" };

export default function ProbarAgentePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Probar agente</h1>
        <p className="text-sm text-muted-foreground">
          Conversá con Sofi como si fueras un visitante del sitio, para probar el prompt sin usar
          WhatsApp. Cada charla de prueba queda en Consultas como un lead web (se identifica por su
          sesión con prefijo <code>prueba-</code>).
        </p>
      </div>
      <ProbarAgente />
    </div>
  );
}
