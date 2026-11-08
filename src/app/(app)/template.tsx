// Se vuelve a montar en cada navegación dentro del panel: le da a cada
// pantalla una entrada suave (keyframe `entrada-pagina` en globals.css).
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-entrada-pagina">{children}</div>;
}
