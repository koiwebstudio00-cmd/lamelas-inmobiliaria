import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
  // Color de la barra del navegador en el celular, según el tema del sistema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00857A" },
    { media: "(prefers-color-scheme: dark)", color: "#030b0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `suppressHydrationWarning`: next-themes agrega la clase del tema antes de
    // que React hidrate, y eso es esperado.
    <html lang="es-AR" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
