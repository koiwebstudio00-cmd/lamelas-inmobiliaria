import { redirect } from "next/navigation";

// FORM-UNICO-01: la captación se cargó hasta el 2026-11-23. Ahora todo se carga
// en Nueva propiedad (mismos campos y mismo mensaje para el grupo). El
// formulario de captación (components/captaciones/captacion-form.tsx) sigue en
// el código, pero ya no tiene pantalla de alta.
export default function NuevaCaptacionPage() {
  redirect("/propiedades/nueva");
}
