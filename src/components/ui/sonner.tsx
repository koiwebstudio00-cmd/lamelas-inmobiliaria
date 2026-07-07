"use client";

import { Toaster as Sonner } from "sonner";

function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        style: { borderRadius: 0 },
      }}
      {...props}
    />
  );
}

export { Toaster };
