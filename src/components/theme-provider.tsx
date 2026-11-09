"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Modo claro / oscuro / sistema (TEMA-OSCURO-01). `next-themes` pone la clase
 * `dark` en <html> antes de pintar (sin parpadeo) y guarda la elección en el
 * navegador. Arranca en claro para no cambiarle la vista a nadie sin que lo
 * pida.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="lamelas-panel-tema"
    >
      {children}
    </NextThemesProvider>
  );
}
