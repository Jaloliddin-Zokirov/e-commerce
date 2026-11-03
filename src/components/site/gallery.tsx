"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Img } from "@/components/img";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImagePlaceholder } from "./product-card";
import { Overlay } from "./overlay";
import { useSite } from "./site-context";

function Lightbox({
  images,
  start,
  alt,
  onClose,
}: {
  images: ImageAsset[];
  start: number;
  alt: string;
  onClose: () => void;
}) {
  const { dict } = useSite();
  const [index, setIndex] = useState(start);
  const go = useCallback((d: number) => setIndex((i) => (i + d + images.length) % images.length), [images.length]);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go]);

  const image = images[index];
  return (
    <Overlay open onClose={onClose} side="top" label={alt} className="inset-0 bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="text-[14px] font-medium text-muted tabular">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="grid size-10 place-items-center rounded-full bg-canvas"
        >
          <X className="size-5" />
        </button>
      </div>
      <div
        className="relative min-h-0 flex-1"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {image && (
          <Img
            key={image.id}
            asset={image}
            alt={`${alt} — ${index + 1}`}
            width={1600}
            sizes="100vw"
            className="absolute inset-0 size-full object-contain p-4 animate-fade-in sm:p-10"
          />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={dict.common.prev}
              className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white shadow-pop ring-1 ring-black/5"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={dict.common.next}
              className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white shadow-pop ring-1 ring-black/5"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto p-4 sm:justify-center">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-canvas transition",
                i === index ? "border-ink" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Img asset={img} alt="" width={320} sizes="64px" className="size-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </Overlay>
  );
}

export function Gallery({ images, alt, overlay }: { images: ImageAsset[]; alt: string; overlay?: ReactNode }) {
  const { dict } = useSite();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const closeZoom = useCallback(() => setZoom(null), []);
  const trackRef = useRef<HTMLDivElement>(null);

  const select = (i: number) => {
    setIndex(i);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-white shadow-tile">
        <ImagePlaceholder />
        {overlay}
      </div>
    );
  }

  return (
    <div>
      <div className="group relative overflow-hidden rounded-[18px] bg-white shadow-tile">
        <div
          ref={trackRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
          }}
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setZoom(i)}
              className="relative size-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`${dict.product.zoom}: ${alt}`}
            >
              <Img
                asset={img}
                alt={`${alt} — ${dict.product.photo} ${i + 1}`}
                priority={i === 0}
                width={1080}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="absolute inset-0 size-full object-contain p-8 sm:p-12"
              />
            </button>
          ))}
        </div>
        {overlay}
        <button
          type="button"
          onClick={() => setZoom(index)}
          aria-label={dict.product.zoom}
          className="absolute bottom-4 right-4 hidden size-10 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-pop ring-1 ring-black/5 transition group-hover:opacity-100 lg:grid"
        >
          <Expand className="size-[18px]" />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden">
            {images.map((img, i) => (
              <span
                key={img.id}
                className={cn("h-1.5 rounded-full bg-ink transition-all", i === index ? "w-5" : "w-1.5 opacity-25")}
              />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 hidden gap-2.5 overflow-x-auto lg:flex">
          {/* Borders sit inside each thumb, so the scroll container never clips them. */}
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => select(i)}
              aria-label={`${dict.product.photo} ${i + 1}`}
              className={cn(
                "size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition",
                i === index ? "border-ink" : "border-white hover:border-line-2",
              )}
            >
              <Img asset={img} alt="" width={320} sizes="80px" className="size-full object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
      {zoom !== null && <Lightbox images={images} start={zoom} alt={alt} onClose={closeZoom} />}
    </div>
  );
}
