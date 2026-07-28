"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, imageUrl } from "@/lib/utils";
import type { PropertyImage } from "@/lib/types";

export function PropertyGallery({
  images,
  title,
}: {
  images: PropertyImage[];
  title: string;
}) {
  const orderedImages = useMemo(
    () => [...images].sort((a, b) => a.orden - b.orden),
    [images]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (orderedImages.length === 0) return null;

  const activeImage = orderedImages[activeIndex] ?? orderedImages[0];
  const hasMany = orderedImages.length > 1;

  function goTo(offset: number) {
    setActiveIndex((current) => {
      const next = current + offset;
      if (next < 0) return orderedImages.length - 1;
      if (next >= orderedImages.length) return 0;
      return next;
    });
  }

  return (
    <section className="space-y-3" aria-label="Galería de fotos">
      <div className="relative aspect-[4/3] overflow-hidden border bg-muted sm:aspect-[16/10]">
        <Image
          key={activeImage.id}
          src={imageUrl(activeImage.url)}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />

        <div className="absolute right-2 top-2 flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="bg-background/90 shadow-sm backdrop-blur"
                aria-label="Expandir foto"
              >
                <Expand />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[calc(100vh-2rem)] max-w-6xl gap-3 bg-background p-2 sm:p-3"
              showCloseButton
            >
              <DialogTitle className="sr-only">{title}</DialogTitle>
              <DialogDescription className="sr-only">
                Foto {activeIndex + 1} de {orderedImages.length}
              </DialogDescription>
              <div className="relative aspect-[4/3] max-h-[calc(100vh-7rem)] w-full overflow-hidden bg-muted sm:aspect-[16/10]">
                <Image
                  src={imageUrl(activeImage.url)}
                  alt={title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
              {hasMany && (
                <div className="flex items-center justify-between px-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => goTo(-1)}
                  >
                    <ChevronLeft />
                    Anterior
                  </Button>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {activeIndex + 1}/{orderedImages.length}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => goTo(1)}
                  >
                    Siguiente
                    <ChevronRight />
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {hasMany && (
          <>
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 shadow-sm backdrop-blur"
              onClick={() => goTo(-1)}
              aria-label="Foto anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 shadow-sm backdrop-blur"
              onClick={() => goTo(1)}
              aria-label="Foto siguiente"
            >
              <ChevronRight />
            </Button>
            <span className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 text-xs tabular-nums text-muted-foreground shadow-sm backdrop-blur">
              {activeIndex + 1}/{orderedImages.length}
            </span>
          </>
        )}
      </div>

      {hasMany && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Miniaturas">
          {orderedImages.map((img, index) => (
            <button
              key={img.id}
              type="button"
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden border bg-muted transition",
                index === activeIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-muted-foreground/50"
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver foto ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <Image
                src={imageUrl(img.url)}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
