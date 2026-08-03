import type { PerfilConversacion } from "@/lib/types";

// Presentación del perfil que el agente fue infiriendo del lead. Sin estado ni
// interacción: es un resumen de solo lectura para el sidebar.

const TEMPERATURA: Record<string, string> = {
  fria: "Fría",
  tibia: "Tibia",
  caliente: "Caliente",
};

const cap = (s: string) => {
  const t = String(s);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function presupuesto(p: PerfilConversacion): string | null {
  if (p.presupuesto_min == null && p.presupuesto_max == null) return null;
  const fmt = (n: number) => n.toLocaleString("es-AR");
  const moneda = p.moneda ? `${p.moneda} ` : "";
  if (p.presupuesto_min != null && p.presupuesto_max != null) {
    return `${moneda}${fmt(p.presupuesto_min)} – ${fmt(p.presupuesto_max)}`;
  }
  const uno = (p.presupuesto_min ?? p.presupuesto_max) as number;
  return `${moneda}${p.presupuesto_min != null ? "desde " : "hasta "}${fmt(uno)}`;
}

export function LeadPerfil({ perfil }: { perfil: PerfilConversacion }) {
  const zona = perfil.zonas?.length ? perfil.zonas.join(", ") : perfil.ciudad;

  const tipos = perfil.tipo_propiedad?.length
    ? perfil.tipo_propiedad.map(cap).join(", ")
    : null;

  const rows: [string, string][] = [];
  if (perfil.intencion) rows.push(["Intención", cap(perfil.intencion)]);
  if (tipos) rows.push(["Tipo", tipos]);
  if (zona) rows.push(["Zona", zona]);
  if (perfil.dormitorios_min) rows.push(["Dormitorios", `${perfil.dormitorios_min}+`]);
  const pres = presupuesto(perfil);
  if (pres) rows.push(["Presupuesto", pres]);
  if (perfil.temperatura) {
    rows.push(["Temperatura", TEMPERATURA[perfil.temperatura] ?? cap(perfil.temperatura)]);
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        El agente todavía no armó un perfil de este lead.
      </p>
    );
  }

  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
