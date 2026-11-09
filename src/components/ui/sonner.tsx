"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

function Toaster(props: React.ComponentProps<typeof Sonner>) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      toastOptions={{
        style: { borderRadius: "var(--radius)" },
      }}
      {...props}
    />
  );
}

export { Toaster };
