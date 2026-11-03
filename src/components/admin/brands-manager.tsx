"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { deleteBrandAction, saveBrandAction } from "@/app/(admin)/admin/_actions/catalog";
import { Img } from "@/components/img";
import type { Brand, ImageAsset } from "@/lib/types";
import { SingleImageInput } from "./image-upload";
import { ConfirmButton, EmptyState, Label, Modal, Spinner, TextField, useToast } from "./ui";

function BrandDialog({ editing, onClose }: { editing: Brand | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [logo, setLogo] = useState<ImageAsset | null>(editing?.logo ?? null);
  const [sort, setSort] = useState(editing?.sort ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const save = async () => {
    setSaving(true);
    const res = await saveBrandAction(editing?.id ?? null, { name, slug: editing?.slug ?? "", logo, sort });
    setSaving(false);
    if (!res.ok) return setError(res.message);
    toast("Brend saqlandi");
    onClose();
    router.refresh();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Brendni tahrirlash" : "Yangi brend"}
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
      <div className="grid gap-5 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div>
          <Label>Logotip</Label>
          <SingleImageInput value={logo} onChange={setLogo} purpose="logo" label="Logo" />
        </div>
        <div className="space-y-4">
          <TextField label="Nomi" required value={name} onChange={(e) => setName(e.target.value)} error={error} autoFocus placeholder="Masalan: Apple" />
          <TextField label="Tartib raqami" type="number" value={sort} onChange={(e) => setSort(Number(e.target.value) || 0)} hint="kichigi oldinda" />
        </div>
      </div>
    </Modal>
  );
}

export function BrandsManager({ brands, counts }: { brands: Brand[]; counts: Record<number, number> }) {
  const router = useRouter();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ editing: Brand | null } | null>(null);
  const close = useCallback(() => setDialog(null), []);
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setDialog({ editing: null })} className="btn btn-primary">
          <Plus className="size-[18px]" /> Yangi brend
        </button>
      </div>
      {brands.length === 0 ? (
        <EmptyState icon={<Tags className="size-6" />} title="Brend yoʻq" text="Masalan: Apple, Sony, DJI…" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-[20px] bg-white p-4 shadow-card">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-canvas text-[16px] font-bold text-muted">
                {b.logo ? <Img asset={b.logo} alt="" width={320} sizes="48px" className="size-full object-contain p-1" /> : b.name.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{b.name}</div>
                <Link href={`/admin/products?q=${encodeURIComponent(b.name)}`} className="text-[12.5px] text-muted hover:text-accent">
                  {counts[b.id] ?? 0} ta mahsulot
                </Link>
              </div>
              <button type="button" onClick={() => setDialog({ editing: b })} aria-label="Tahrirlash" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
                <Pencil className="size-4" />
              </button>
              <ConfirmButton
                className="grid size-9 place-items-center rounded-lg text-sale hover:bg-sale-soft"
                title="Brendni oʻchirish"
                text={`«${b.name}» oʻchiriladi. Mahsulotlar oʻchirilmaydi, faqat brendsiz qoladi.`}
                onConfirm={async () => {
                  await deleteBrandAction(b.id);
                  toast("Brend oʻchirildi");
                  router.refresh();
                }}
              >
                <Trash2 className="size-4" />
              </ConfirmButton>
            </div>
          ))}
        </div>
      )}
      {dialog && <BrandDialog editing={dialog.editing} onClose={close} />}
    </div>
  );
}
