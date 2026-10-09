"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutorAvatar } from "@/components/feedback/autor-avatar";
import { crearFeedback } from "@/actions/feedback";
import { uploadAttachments } from "@/lib/upload-attachments";
import { cn } from "@/lib/utils";
import { TIPOS_CON_ADJUNTOS, TIPOS_FEEDBACK, type FeedbackTipo } from "@/lib/types";

const MAX = 6;

/**
 * Caja para publicar en el canal. Arranca cerrada (una línea, como el campo de
 * mensaje de un chat) y al tocarla se abre con el tipo, el título y el detalle.
 * Al publicar se queda en el canal: la publicación nueva aparece arriba.
 */
export function NuevaPublicacion({ userId, nombre }: { userId: string; nombre: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [abierta, setAbierta] = useState(false);
  const [tipo, setTipo] = useState<FeedbackTipo>("error");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Aviso que queda a la vista después de publicar (capturas que fallaron). */
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const aceptaImagenes = TIPOS_CON_ADJUNTOS.includes(tipo);

  function cerrar() {
    formRef.current?.reset();
    setFiles([]);
    setError(null);
    setTipo("error");
    setAbierta(false);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...imgs].slice(0, MAX));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    const data = new FormData(e.currentTarget);
    const titulo = String(data.get("titulo") ?? "").trim();
    const descripcion = String(data.get("descripcion") ?? "").trim();
    const urlContexto = String(data.get("url_contexto") ?? "").trim();
    if (titulo.length < 3 || descripcion.length < 5) {
      setError("Poné un título y contá un poco más qué pasa.");
      return;
    }
    const userAgent =
      aceptaImagenes && typeof navigator !== "undefined"
        ? navigator.userAgent.slice(0, 500)
        : undefined;

    startTransition(async () => {
      const res = await crearFeedback({
        tipo,
        titulo,
        descripcion,
        url_contexto: aceptaImagenes ? urlContexto || undefined : undefined,
        user_agent: userAgent,
      });
      if (res.error || !res.id) {
        setError(res.error ?? "No pudimos publicar. Probá de nuevo.");
        return;
      }
      // La publicación ya existe aunque fallen las capturas: se cierra igual
      // (reintentar duplicaría la publicación) y se avisa qué no se subió.
      let fallaron = 0;
      if (aceptaImagenes && files.length > 0) {
        const up = await uploadAttachments(res.id, files);
        fallaron = up.error ? files.length - up.ok : up.failed;
      }
      cerrar();
      if (fallaron > 0) {
        setAviso(
          fallaron === 1
            ? "Se publicó, pero una captura no se pudo subir. Podés describir lo que mostraba en una respuesta."
            : `Se publicó, pero ${fallaron} capturas no se pudieron subir. Podés describir lo que mostraban en una respuesta.`
        );
      }
      router.refresh();
    });
  }

  if (!abierta) {
    return (
      <div className="space-y-2">
        {aviso && <p className="border bg-amber-50 p-3 text-sm text-amber-900">{aviso}</p>}
        <button
          type="button"
          onClick={() => setAbierta(true)}
          className="flex w-full items-center gap-3 border bg-background p-3 text-left text-sm text-muted-foreground hover:bg-muted/40"
        >
          <AutorAvatar id={userId} nombre={nombre} />
          <span>Contale al equipo un error, un problema o una idea…</span>
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 border bg-background p-4">
      <div className="space-y-2">
        <Label>¿Qué querés publicar?</Label>
        <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-3 gap-2">
          {TIPOS_FEEDBACK.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={tipo === t.value}
              onClick={() => setTipo(t.value)}
              className={cn(
                "border px-3 py-2 text-sm font-medium transition-colors",
                tipo === t.value
                  ? "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_var(--color-primary)]"
                  : "bg-background hover:bg-muted/50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {TIPOS_FEEDBACK.find((t) => t.value === tipo)?.ayuda}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          name="titulo"
          autoComplete="off"
          required
          maxLength={200}
          autoFocus
          placeholder="En pocas palabras"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Detalle</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          required
          rows={4}
          maxLength={5000}
          placeholder={
            tipo === "sugerencia"
              ? "¿Qué te gustaría que haga el sistema y para qué te serviría?"
              : "¿Qué estabas haciendo y qué pasó?"
          }
        />
      </div>

      {aceptaImagenes && (
        <>
          <div className="space-y-2">
            <Label htmlFor="url_contexto">¿En qué pantalla? (opcional)</Label>
            <Input
              id="url_contexto"
              name="url_contexto"
              autoComplete="off"
              maxLength={500}
              placeholder="Ej: Propiedades → Nueva"
            />
          </div>
          <div className="space-y-2">
            <Label>Capturas (opcional, hasta {MAX})</Label>
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
                      aria-label={`Quitar ${f.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={cerrar} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Publicando..." : "Publicar"}
        </Button>
      </div>
    </form>
  );
}
