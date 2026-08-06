"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearFeedback } from "@/actions/feedback";

/** Alta de una sugerencia de mejora. Solo texto. */
export function SugerenciaForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const titulo = String(data.get("titulo") ?? "").trim();
    const descripcion = String(data.get("descripcion") ?? "").trim();
    if (titulo.length < 3 || descripcion.length < 5) {
      setError("Completá el título y contanos un poco más.");
      return;
    }
    startTransition(async () => {
      const res = await crearFeedback({ tipo: "sugerencia", titulo, descripcion });
      if (res.error || !res.id) {
        setError(res.error ?? "No pudimos guardar la sugerencia.");
        return;
      }
      router.push(`/feedback/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">¿Qué mejorarías?</Label>
        <Input id="titulo" name="titulo" autoComplete="off" required maxLength={200} placeholder="Un título corto" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Contanos con detalle</Label>
        <Textarea id="descripcion" name="descripcion" required rows={5} maxLength={5000} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar sugerencia"}
      </Button>
    </form>
  );
}
