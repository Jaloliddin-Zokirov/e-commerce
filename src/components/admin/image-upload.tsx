"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Img } from "@/components/img";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "./ui";

type Pending = { key: string; name: string; progress: number };

function upload(files: File[], purpose: string, onProgress: (p: number) => void) {
  return new Promise<{ assets: ImageAsset[]; errors: string[] }>((resolve, reject) => {
    const form = new FormData();
    form.append("purpose", purpose);
    files.forEach((f) => form.append("files", f));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 401) return reject(new Error("Sessiya tugagan — qayta kiring"));
        resolve({ assets: data.assets ?? [], errors: data.errors ?? (data.error ? [data.error] : []) });
      } catch {
        reject(new Error("Yuklashda xatolik"));
      }
    };
    xhr.onerror = () => reject(new Error("Internet aloqasini tekshiring"));
    xhr.send(form);
  });
}

function useUploader(purpose: string, onDone: (assets: ImageAsset[]) => void) {
  const toast = useToast();
  const [pending, setPending] = useState<Pending[]>([]);
  const start = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (files.length === 0) return;
    const key = `${Date.now()}`;
    setPending((p) => [...p, { key, name: files.length > 1 ? `${files.length} ta rasm` : files[0].name, progress: 0 }]);
    try {
      const { assets, errors } = await upload(files, purpose, (progress) =>
        setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
      );
      if (assets.length) onDone(assets);
      errors.forEach((e) => toast(e, "error"));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPending((p) => p.filter((x) => x.key !== key));
    }
  };
  return { pending, start };
}

export function ImageGalleryInput({
  value,
  onChange,
  colors = [],
}: {
  value: ImageAsset[];
  onChange: (v: ImageAsset[]) => void;
  colors?: { id: string; label: string; hex?: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Uploads finish later; append to whatever the gallery holds by then.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const { pending, start } = useUploader("product", (assets) => {
    latest.current = [...latest.current, ...assets];
    onChange(latest.current);
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(false);
          void start(e.dataTransfer.files);
        }}
        className={cn(
          "grid grid-cols-3 gap-3 rounded-[18px] p-1 transition sm:grid-cols-4 lg:grid-cols-5",
          dragOver && "bg-accent-soft ring-2 ring-accent",
        )}
      >
        {value.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
            }}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-white ring-1 ring-line",
              dragIndex === i && "opacity-40",
              i === 0 && "ring-2 ring-ink",
            )}
          >
            <div className="aspect-square cursor-grab bg-[#fafafa] active:cursor-grabbing">
              <Img asset={img} alt="" width={320} sizes="160px" className="size-full object-contain p-2" />
            </div>
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-semibold text-white">Asosiy</span>
            )}
            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== img.id))}
                aria-label="Rasmni oʻchirish"
                className="grid size-7 place-items-center rounded-full bg-white/95 text-sale shadow"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1 border-t border-line bg-white p-1.5">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label="Chapga"
                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30"
              >
                <ArrowLeft className="size-3.5" />
              </button>
              {colors.length > 0 ? (
                <select
                  value={img.color ?? ""}
                  onChange={(e) =>
                    onChange(value.map((x) => (x.id === img.id ? { ...x, color: e.target.value || null } : x)))
                  }
                  className="h-7 min-w-0 flex-1 rounded-lg bg-canvas px-1.5 text-[11.5px] font-medium outline-none"
                  aria-label="Rasm rangi"
                >
                  <option value="">Barcha ranglar</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || "—"}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="flex-1" />
              )}
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === value.length - 1}
                aria-label="Oʻngga"
                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {pending.map((p) => (
          <div key={p.key} className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-canvas p-3 text-center">
            <UploadCloud className="size-6 animate-pulse text-accent" />
            <div className="mt-2 w-full truncate text-[11px] text-muted">{p.name}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round(p.progress * 100)}%` }} />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-2 bg-[#fbfbfd] text-center text-muted transition hover:border-accent hover:bg-accent-soft hover:text-accent"
        >
          <ImagePlus className="size-7" />
          <span className="px-2 text-[12px] font-medium leading-tight">Rasm qoʻshish</span>
        </button>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
        Rasmlarni shu yerga sudrab tashlang yoki tanlang (JPG, PNG, WEBP · 20 MB gacha). Birinchi rasm — asosiy.
        Tartibni sudrab yoki ← → tugmalari bilan oʻzgartiring.
        {colors.length > 0 && " Har bir rasmga rang belgilasangiz, saytda shu rang tanlanganda faqat uning rasmlari chiqadi."}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void start(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function SingleImageInput({
  value,
  onChange,
  purpose = "product",
  aspect = "aspect-square",
  label = "Rasm yuklash",
  className,
}: {
  value: ImageAsset | null;
  onChange: (v: ImageAsset | null) => void;
  purpose?: "product" | "banner" | "logo";
  aspect?: string;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { pending, start } = useUploader(purpose, (assets) => onChange(assets[0] ?? null));
  const busy = pending.length > 0;
  return (
    <div className={className}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void start([...e.dataTransfer.files].slice(0, 1));
        }}
        className={cn("group relative overflow-hidden rounded-2xl bg-[#fafafa] ring-1 ring-line", aspect)}
      >
        {value ? (
          <>
            <Img asset={value} alt="" width={640} sizes="320px" className="size-full object-contain p-2" />
            <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
              <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-sm h-8 min-h-0 bg-white/95 px-3 text-[12.5px] shadow">
                Almashtirish
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                aria-label="Oʻchirish"
                className="grid size-8 place-items-center rounded-full bg-white/95 text-sale shadow"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 text-muted transition hover:bg-accent-soft hover:text-accent"
          >
            {busy ? <UploadCloud className="size-7 animate-pulse text-accent" /> : <ImagePlus className="size-7" />}
            <span className="text-[12.5px] font-medium">{busy ? `${Math.round((pending[0]?.progress ?? 0) * 100)}%` : label}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void start([e.target.files[0]]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
