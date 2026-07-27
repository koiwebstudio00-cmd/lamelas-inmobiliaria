"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePhoto, setPortada } from "@/actions/images";
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
        <p className="border border-dashed p-8 text-center text-sm text-muted-foreground">
          Sin fotos todavía. La primera que subas queda como portada.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-[4/3] border bg-muted">
              <Image
                src={imageUrl(img.url)}
                alt="Foto de la propiedad"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
              {img.es_portada && (
                <span className="absolute left-1 top-1 bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  Portada
                </span>
              )}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {!img.es_portada && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-8"
                    disabled={busyId === img.id}
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
                  disabled={busyId === img.id}
                  onClick={() => handleDelete(img)}
                  aria-label="Eliminar foto"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
