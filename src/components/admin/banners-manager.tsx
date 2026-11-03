"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import {
  deleteBannerAction,
  moveBannerAction,
  saveBannerAction,
  toggleBannerAction,
} from "@/app/(admin)/admin/_actions/banners";
import { Img } from "@/components/img";
import type { BannerInput } from "@/lib/repo/banners";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SingleImageInput } from "./image-upload";
import { ConfirmButton, EmptyState, Label, LocalizedField, Modal, Spinner, StatusPill, TextField, Toggle, useToast } from "./ui";

/** Banner backgrounds; dark ones switch the banner text to white. */
const BACKGROUNDS: { bg: string; theme: "light" | "dark"; label: string }[] = [
  { bg: "#f5f5f7", theme: "light", label: "Och kulrang" },
  { bg: "#ffffff", theme: "light", label: "Oq" },
  { bg: "#e3eefb", theme: "light", label: "Moviy" },
  { bg: "#fbeee6", theme: "light", label: "Shaftoli" },
  { bg: "#e9f5ec", theme: "light", label: "Yashil" },
  { bg: "#1d1d1f", theme: "dark", label: "Grafit" },
  { bg: "#000000", theme: "dark", label: "Qora" },
];

function themeFor(hex: string): "light" | "dark" {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum < 140 ? "dark" : "light";
}

/** Mirrors the storefront hero: rounded banner, text on the left, product on the right. */
function BannerPreview({ form }: { form: BannerInput }) {
  const dark = form.theme === "dark";
  return (
    <div className={cn("overflow-hidden rounded-2xl ring-1 ring-line", dark ? "text-white" : "text-ink")} style={{ backgroundColor: form.bg }}>
      <div className="grid aspect-[16/7] grid-cols-[1fr_1.1fr] items-center">
        <div className="p-5">
          <div className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">{form.title.uz || "Sarlavha"}</div>
          {form.subtitle.uz && <div className={cn("mt-1 line-clamp-2 text-[11.5px]", dark ? "text-white/70" : "text-ink-2")}>{form.subtitle.uz}</div>}
          {form.button.uz && (
            <span className={cn("mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold", dark ? "bg-white text-ink" : "bg-ink text-white")}>
              {form.button.uz}
            </span>
          )}
        </div>
        <div className="relative h-full">
          {form.image && <Img asset={form.image} alt="" width={640} sizes="300px" className="absolute inset-0 size-full object-contain p-3" />}
        </div>
      </div>
    </div>
  );
}

function BannerDialog({ editing, onClose }: { editing: Banner | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<BannerInput>(
    editing
      ? {
          title: editing.title,
          subtitle: editing.subtitle,
          button: editing.button,
          link: editing.link,
          image: editing.image,
          imageMobile: editing.imageMobile,
          theme: editing.theme,
          bg: editing.bg,
          accent: editing.accent,
          sort: editing.sort,
          isActive: editing.isActive,
        }
      : {
          title: { uz: "", ru: "" },
          subtitle: { uz: "", ru: "" },
          button: { uz: "Batafsil", ru: "Подробнее" },
          link: "",
          image: null,
          imageMobile: null,
          theme: "light",
          bg: "#f5f5f7",
          accent: "",
          sort: 0,
          isActive: true,
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const save = async () => {
    setSaving(true);
    const res = await saveBannerAction(editing?.id ?? null, form);
    setSaving(false);
    if (!res.ok) return setError(res.message);
    toast("Banner saqlandi");
    onClose();
    router.refresh();
  };
  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={editing ? "Bannerni tahrirlash" : "Yangi banner"}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-soft">
            Bekor qilish
          </button>
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving && <Spinner />} Saqlash
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <BannerPreview form={form} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required hint="keng rasm, shaffof fon tavsiya etiladi">
              Rasm (kompyuter)
            </Label>
            <SingleImageInput value={form.image} onChange={(image) => setForm({ ...form, image })} purpose="banner" aspect="aspect-[16/9]" />
          </div>
          <div>
            <Label hint="ixtiyoriy">Rasm (telefon)</Label>
            <SingleImageInput value={form.imageMobile} onChange={(imageMobile) => setForm({ ...form, imageMobile })} purpose="banner" aspect="aspect-[16/9]" />
          </div>
        </div>
        <p className="rounded-2xl bg-canvas px-4 py-3 text-[12.5px] leading-relaxed text-muted">
          Bosh sahifada banner tanlangan fonda koʻrsatiladi: matn chapda, mahsulot rasmi oʻngda. Shaffof yoki fon rangiga mos fonli
          (PNG) mahsulot rasmi eng chiroyli chiqadi. Havola mahsulotga boʻlsa, uning joriy narxi avtomatik koʻrsatiladi.
        </p>
        <LocalizedField label="Sarlavha" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <LocalizedField label="Matn" value={form.subtitle} onChange={(subtitle) => setForm({ ...form, subtitle })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <LocalizedField label="Tugma matni" value={form.button} onChange={(button) => setForm({ ...form, button })} />
          <TextField
            label="Havola"
            hint="/product/… yoki /catalog/…"
            placeholder="/product/iphone-17-pro"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
        </div>
        <div>
          <Label hint="qora fonda matn oq boʻladi">Fon rangi</Label>
          <div className="flex flex-wrap items-center gap-2">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.bg}
                type="button"
                onClick={() => setForm({ ...form, bg: b.bg, theme: b.theme })}
                aria-label={b.label}
                title={b.label}
                className={cn("size-9 rounded-full border-[3px]", form.bg.toLowerCase() === b.bg ? "border-ink" : "border-white")}
                style={{ background: b.bg, boxShadow: "0 0 0 1px rgb(0 0 0 / 0.12)" }}
              />
            ))}
            <label className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-canvas text-[16px] ring-1 ring-line" title="Boshqa rang">
              +
              <input
                type="color"
                value={form.bg}
                onChange={(e) => setForm({ ...form, bg: e.target.value, theme: themeFor(e.target.value) })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
        <Toggle checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Saytda koʻrsatish" />
        {error && <p className="text-[13px] font-medium text-sale">{error}</p>}
      </div>
    </Modal>
  );
}

export function BannersManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ editing: Banner | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const close = useCallback(() => setDialog(null), []);
  const act = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setDialog({ editing: null })} className="btn btn-primary">
          <Plus className="size-[18px]" /> Yangi banner
        </button>
      </div>
      {banners.length === 0 ? (
        <EmptyState icon={<ImageIcon className="size-6" />} title="Banner yoʻq" text="Bosh sahifadagi katta slayder uchun banner qoʻshing." />
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-[22px] bg-white p-4 shadow-card">
              <div
                className="h-24 w-44 shrink-0 overflow-hidden rounded-xl ring-1 ring-line"
                style={{ backgroundColor: b.bg }}
              >
                {b.image && <Img asset={b.image} alt="" width={640} sizes="176px" className="size-full object-contain p-1" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{b.title.uz || "Rasmli banner"}</span>
                  {b.isDemo && <StatusPill tone="warn">demo</StatusPill>}
                  {!b.isActive && <StatusPill tone="muted">yashirin</StatusPill>}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[13px] text-muted">{b.subtitle.uz}</div>
                {b.link && <div className="mt-0.5 text-[12.5px] text-accent">{b.link}</div>}
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={b.isActive} onChange={(v) => act(() => toggleBannerAction(b.id, v))} />
                <div className="flex gap-0.5">
                  <button type="button" disabled={i === 0 || pending} onClick={() => act(() => moveBannerAction(b.id, -1))} aria-label="Yuqoriga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" disabled={i === banners.length - 1 || pending} onClick={() => act(() => moveBannerAction(b.id, 1))} aria-label="Pastga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30">
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => setDialog({ editing: b })} aria-label="Tahrirlash" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
                    <Pencil className="size-4" />
                  </button>
                  <ConfirmButton
                    className="grid size-9 place-items-center rounded-lg text-sale hover:bg-sale-soft"
                    title="Bannerni oʻchirish"
                    onConfirm={async () => {
                      await deleteBannerAction(b.id);
                      toast("Banner oʻchirildi");
                      router.refresh();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </ConfirmButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {dialog && <BannerDialog editing={dialog.editing} onClose={close} />}
    </div>
  );
}
