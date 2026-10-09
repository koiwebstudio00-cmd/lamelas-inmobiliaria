import { redirect } from "next/navigation";

// "Configuración" es un grupo del menú (Equipo, Incidentes, Integraciones), no
// una pantalla. La ruta vieja mostraba las API keys: se manda a Integraciones.
export default function ConfiguracionPage() {
  redirect("/configuracion/integraciones");
}
