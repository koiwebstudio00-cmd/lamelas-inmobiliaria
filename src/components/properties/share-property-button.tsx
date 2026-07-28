"use client";

import { useState } from "react";
import { Check, Copy, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function propertyShareUrl(propertyId: string) {
  const publicSite = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const origin = window.location.origin.replace(/\/+$/, "");

  return `${publicSite || origin}/propiedades/${propertyId}`;
}

export function SharePropertyButton({
  propertyId,
  size = "sm",
  compact = false,
}: {
  propertyId: string;
  size?: "sm" | "icon-sm";
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = propertyShareUrl(propertyId);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No pudimos copiar el link.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon-sm" : size}
      onClick={copyLink}
      aria-label={copied ? "Link copiado" : "Copiar link para compartir"}
    >
      {copied ? <Check /> : <Share2Icon />}
      {!compact && <span>{copied ? "Copiado" : "Compartir link"}</span>}
    </Button>
  );
}
