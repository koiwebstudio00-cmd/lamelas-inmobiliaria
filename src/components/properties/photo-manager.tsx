"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePhoto, reorderPhotos, setPortada } from "@/actions/images";
import { cn } from "@/lib/utils";
import { uploadPropertyPhotos } from "@/lib/upload-photos";
import { imageUrl } from "@/lib/utils";
import type { PropertyImage } from "@/lib/types";

const MAX_FOTOS = 20;

export function PhotoManager({
  propertyId,
  images,
}: {
  propertyId: string;
  images: PropertyImage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Orden local (FOTOS-ORDEN-01): se actualiza al instante al mover y vuelve
  // atrás si la API rechaza el cambio. Se resincroniza cuando llegan fotos
  // nuevas del servidor (subida, borrado, refresh).
  const [ordered, setOrdered] = useState(() => sortByOrden(images));
  const [imagesPrevias, setImagesPrevias] = useState(images);
  if (images !== imagesPrevias) {
    setImagesPrevias(images);
    setOrdered(sortByOrden(images));
  }
  const draggedId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const bloqueado = uploading || savingOrder || busyId !== null;

  async function moveImage(from: number, to: number) {
    if (bloqueado || from === to || from < 0 || to < 0 || to >= ordered.length) return;
    const previous = ordered;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrdered(next);
    setSavingOrder(true);
    const error = await reorderPhotos(propertyId, next.map((img) => img.id));
    setSavingOrder(false);
    if (error) {
      setOrdered(previous);
      toast.error(error);
    } else {
      router.refresh();
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_FOTOS - images.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_FOTOS} fotos por propiedad.`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length < files.length) {
      toast.warning(`Solo se suben ${selected.length} (límite de ${MAX_FOTOS}).`);
    }

    setUploading(true);
    const { ok, failed, error } = await uploadPropertyPhotos(propertyId, selected);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (error) toast.error(error);
    else if (failed > 0) {
      toast.warning(`${failed} foto(s) no se pudieron subir. Probá de nuevo.`);
    }
    if (ok > 0) {
      toast.success(ok === 1 ? "Foto subida" : `${ok} fotos subidas`);
      router.refresh();
    }
  }

  async function handlePortada(image: PropertyImage) {
    setBusyId(image.id);
    const error = await setPortada(image.id, propertyId);
    setBusyId(null);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Portada actualizada");
      router.refresh();
    }
  }

  // La API borra el objeto en R2 y promueve la siguiente portada si hacía falta.
  async function handleDelete(image: PropertyImage) {
    setBusyId(image.id);
    const error = await deletePhoto(image.id, propertyId);
    setBusyId(null);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Foto eliminada");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Fotos{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {images.length}/{MAX_FOTOS}
          </span>
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || images.length >= MAX_FOTOS}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading ? "Subiendo..." : "Agregar fotos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Sin fotos todavía. La primera que subas queda como portada.
        </p>
      ) : (
        <>
          {ordered.length > 1 && (
            <p className="text-sm text-muted-foreground">
              Arrastrá una foto para cambiar el orden (en el celular, usá las flechas). La
              portada se elige con la estrella.
              {savingOrder && <Loader2 className="ml-2 inline size-3.5 animate-spin" />}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {ordered.map((img, index) => (
              <div
                key={img.id}
                draggable={ordered.length > 1 && !bloqueado}
                onDragStart={(event) => {
                  draggedId.current = img.id;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", img.id);
                }}
                onDragOver={(event) => {
                  if (draggedId.current && draggedId.current !== img.id) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    if (overId !== img.id) setOverId(img.id);
                  }
                }}
                onDragLeave={() => setOverId((id) => (id === img.id ? null : id))}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = ordered.findIndex((i) => i.id === draggedId.current);
                  draggedId.current = null;
                  setOverId(null);
                  void moveImage(from, index);
                }}
                onDragEnd={() => {
                  draggedId.current = null;
                  setOverId(null);
                }}
                className={cn(
                  "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted transition-[box-shadow,scale,opacity] duration-200",
                  ordered.length > 1 && !bloqueado && "cursor-grab active:cursor-grabbing",
                  overId === img.id && "scale-[1.03] ring-2 ring-primary",
                )}
              >
                <Image
                  src={imageUrl(img.url)}
                  alt={`Foto ${index + 1} de la propiedad`}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
                {ordered.length > 1 && (
                  <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground">
                    <GripVertical className="hidden size-3 sm:block" aria-hidden />
                    {index + 1}
                  </span>
                )}
                {img.es_portada && (
                  <span className="absolute right-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                    Portada
                  </span>
                )}
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
                  {ordered.length > 1 ? (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="size-8"
                        disabled={index === 0 || bloqueado}
                        onClick={() => void moveImage(index, index - 1)}
                        aria-label={`Mover la foto ${index + 1} antes`}
                      >
                        <ArrowLeft />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="size-8"
                        disabled={index === ordered.length - 1 || bloqueado}
                        onClick={() => void moveImage(index, index + 1)}
                        aria-label={`Mover la foto ${index + 1} después`}
                      >
                        <ArrowRight />
                      </Button>
                    </div>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-1">
                    {!img.es_portada && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="size-8"
                        disabled={bloqueado}
                        onClick={() => handlePortada(img)}
                        aria-label="Marcar como portada"
                      >
                        <Star />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="size-8"
                      disabled={bloqueado}
                      onClick={() => handleDelete(img)}
                      aria-label="Eliminar foto"
                    >
                      {busyId === img.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function sortByOrden(images: PropertyImage[]) {
  return [...images].sort((a, b) => a.orden - b.orden);
}
