import type { MetadataRoute } from "next";

/**
 * Manifiesto de la app instalable (PUSH-PWA-01). Con esto el panel se puede
 * agregar a la pantalla de inicio y se abre como app, sin la barra del
 * navegador. Next lo sirve en /manifest.webmanifest (excluido del middleware:
 * el navegador lo pide sin sesión).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lamelas & Chaumont — Panel",
    short_name: "Lamelas",
    description: "Panel interno de propiedades y consultas",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    background_color: "#ffffff",
    theme_color: "#0E9145",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
