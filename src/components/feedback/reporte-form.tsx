"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearFeedback } from "@/actions/feedback";
import { uploadAttachments } from "@/lib/upload-attachments";

const MAX = 6;

/** Alta de un reporte de error, con imágenes (capturas) opcionales. */
export function ReporteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...imgs].slice(0, MAX));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const titulo = String(data.get("titulo") ?? "").trim();
    const descripcion = String(data.get("descripcion") ?? "").trim();
    const urlContexto = String(data.get("url_contexto") ?? "").trim();
    if (titulo.length < 3 || descripcion.length < 5) {
      setError("Completá el título y contanos qué pasó.");
      return;
    }
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined;

    startTransition(async () => {
      const res = await crearFeedback({
        tipo: "error",
        titulo,
        descripcion,
        url_contexto: urlContexto || undefined,
        user_agent: userAgent,
      });
      if (res.error || !res.id) {
        setError(res.error ?? "No pudimos guardar el reporte.");
        return;
      }
      if (files.length > 0) {
        const up = await uploadAttachments(res.id, files);
        if (up.error) {
          setError(`El reporte se guardó, pero las imágenes fallaron: ${up.error}`);
          router.push(`/feedback/${res.id}`);
          return;
        }
      }
      router.push(`/feedback/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">¿Qué salió mal?</Label>
        <Input id="titulo" name="titulo" autoComplete="off" required maxLength={200} placeholder="Un título corto del error" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Contanos qué pasó y cómo llegar al error</Label>
        <Textarea id="descripcion" name="descripcion" required rows={5} maxLength={5000} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="url_contexto">¿En qué pantalla pasó? (opcional)</Label>
        <Input id="url_contexto" name="url_contexto" autoComplete="off" maxLength={500} placeholder="Ej: Propiedades → Nueva" />
      </div>

      <div className="space-y-2">
        <Label>Imágenes (opcional, hasta {MAX})</Label>
        <label className="flex cursor-pointer items-center gap-2 border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
          <Paperclip className="size-4" /> Agregar capturas
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-1 border px-2 py-1 text-xs">
                <span className="max-w-[160px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Quitar"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar reporte"}
      </Button>
    </form>
  );
}
