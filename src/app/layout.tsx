import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Lamelas & Chaumont",
  description: "Sistema interno de registro de propiedades",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  // App instalada en iPhone (PUSH-PWA-01): nombre bajo el ícono y barra de
  // estado. El manifiesto lo arma src/app/manifest.ts.
  appleWebApp: {
    capable: true,
    title: "Lamelas",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Permite usar env(safe-area-inset-*) para no quedar debajo del notch ni
  // de la barra de gestos del iPhone (barra inferior de navegación).
  viewportFit: "cover",
  themeColor: "#00857A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
