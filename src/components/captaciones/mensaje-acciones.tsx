"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { linkWhatsApp } from "@/lib/captacion";

/** Copiar el mensaje o abrirlo en WhatsApp para elegir el grupo. */
export function MensajeAcciones({ mensaje }: { mensaje: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      toast.success("Mensaje copiado. Pegalo en el grupo.");
    } catch {
      toast.error("No se pudo copiar: seleccioná el texto y copialo a mano.");
    }
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
        <a href={linkWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer">
          <WhatsappIcon className="size-4" /> Abrir WhatsApp
        </a>
      </Button>
      <Button type="button" variant="outline" onClick={copiar}>
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar texto"}
      </Button>
    </div>
  );
}
