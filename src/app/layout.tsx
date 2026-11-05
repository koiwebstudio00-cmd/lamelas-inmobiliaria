import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
  themeColor: "#0E9145",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
