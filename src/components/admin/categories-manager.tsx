"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import {
  deleteCategoryAction,
  moveCategoryAction,
  saveCategoryAction,
  toggleCategoryAction,
} from "@/app/(admin)/admin/_actions/catalog";
import { Img } from "@/components/img";
import type { CategoryInput } from "@/lib/repo/categories";
import { slugify } from "@/lib/slug";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SingleImageInput } from "./image-upload";
import { ConfirmButton, EmptyState, Label, LocalizedField, Modal, Spinner, TextField, Toggle, useToast } from "./ui";

type Node = Category & { children: Category[] };

function CategoryDialog({
  open,
  onClose,
  editing,
  roots,
  defaultParent,
}: {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  roots: Category[];
  defaultParent: number | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<CategoryInput>(() =>
    editing
      ? {
          parentId: editing.parentId,
          slug: editing.slug,
          name: editing.name,
          subtitle: editing.subtitle,
          image: editing.image,
          sort: editing.sort,
          isActive: editing.isActive,
          inMenu: editing.inMenu,
        }
      : { parentId: defaultParent, slug: "", name: { uz: "", ru: "" }, subtitle: { uz: "", ru: "" }, image: null, sort: 0, isActive: true, inMenu: false },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    setSaving(true);
    setError(undefined);
    const res = await saveCategoryAction(editing?.id ?? null, form);
    setSaving(false);
    if (!res.ok) return setError(res.message);
    toast(editing ? "Kategoriya saqlandi" : "Kategoriya qoʻshildi");
    onClose();
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
      wide
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
      <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div>
          <Label>Rasm</Label>
          <SingleImageInput value={form.image} onChange={(image) => setForm({ ...form, image })} />
          <p className="mt-2 text-[12px] text-muted">Bosh sahifadagi kategoriya kartochkasida chiqadi</p>
        </div>
        <div className="space-y-4">
          <LocalizedField
            label="Nomi"
            required
            value={form.name}
            error={error && !form.name.uz ? error : undefined}
            onChange={(name) => setForm((f) => ({ ...f, name, slug: editing ? f.slug : slugify(name.uz) }))}
          />
          <LocalizedField
            label="Qisqa tavsif"
            hint="bosh sahifa kartochkasida"
            value={form.subtitle}
            placeholder={{ uz: "Masalan: Faqat rasmiy texnika" }}
            onChange={(subtitle) => setForm({ ...form, subtitle })}
          />
          <label className="block">
            <Label>Ota kategoriya</Label>
            <select
              className="field"
              value={form.parentId ?? ""}
              onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">— Asosiy (yuqori daraja) —</option>
              {roots
                .filter((r) => r.id !== editing?.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.uz}
                  </option>
                ))}
            </select>
          </label>
          <TextField
            label="Havola (slug)"
            hint="lotin harflari"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
          />
          <div className="space-y-3 rounded-2xl bg-canvas p-4">
            <Toggle checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Faol" description="Oʻchirilsa, kategoriya saytda koʻrinmaydi" />
            <Toggle checked={form.inMenu} onChange={(inMenu) => setForm({ ...form, inMenu })} label="Yuqori menyuda koʻrsatish" description="Sarlavha ostidagi qatorda va bosh sahifa kartochkalarida chiqadi" />
          </div>
          {error && <p className="text-[13px] font-medium text-sale">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

export function CategoriesManager({ tree, counts }: { tree: Node[]; counts: Record<number, number> }) {
  const router = useRouter();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ editing: Category | null; parent: number | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const close = useCallback(() => setDialog(null), []);

  const act = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const row = (c: Category, depth: number, index: number, siblings: number) => (
    <div key={c.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", depth > 0 && "bg-[#fafafc] pl-6 sm:pl-14")}>
      <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">
        {c.image && <Img asset={c.image} alt="" width={320} sizes="44px" className="size-full object-contain p-0.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-semibold", !c.isActive && "text-muted line-through")}>
          {c.name.uz}
          {c.name.ru && c.name.ru !== c.name.uz && <span className="font-normal text-muted"> · {c.name.ru}</span>}
        </div>
        <div className="text-[12.5px] text-muted">
          /{c.slug} ·{" "}
          <Link href={`/admin/products?cat=${c.id}`} className="hover:text-accent">
            {counts[c.id] ?? 0} ta mahsulot
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[12.5px] text-muted">
          Menyuda
          <Toggle checked={c.inMenu} onChange={(v) => act(() => toggleCategoryAction(c.id, "inMenu", v))} />
        </label>
        <label className="flex items-center gap-2 text-[12.5px] text-muted">
          Faol
          <Toggle checked={c.isActive} onChange={(v) => act(() => toggleCategoryAction(c.id, "isActive", v))} />
        </label>
        <div className="flex gap-0.5">
          <button type="button" disabled={index === 0 || pending} onClick={() => act(() => moveCategoryAction(c.id, -1))} aria-label="Yuqoriga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30">
            <ArrowUp className="size-4" />
          </button>
          <button type="button" disabled={index === siblings - 1 || pending} onClick={() => act(() => moveCategoryAction(c.id, 1))} aria-label="Pastga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30">
            <ArrowDown className="size-4" />
          </button>
          <button type="button" onClick={() => setDialog({ editing: c, parent: c.parentId })} aria-label="Tahrirlash" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
            <Pencil className="size-4" />
          </button>
          <ConfirmButton
            className="grid size-9 place-items-center rounded-lg text-sale hover:bg-sale-soft"
            title="Kategoriyani oʻchirish"
            text={
              <>
                «{c.name.uz}» oʻchiriladi. Undagi mahsulotlar oʻchirilmaydi — ular kategoriyasiz qoladi
                {depth === 0 ? ", ichki kategoriyalar esa yuqori darajaga koʻtariladi" : ""}.
              </>
            }
            onConfirm={async () => {
              await deleteCategoryAction(c.id);
              toast("Kategoriya oʻchirildi");
              router.refresh();
            }}
          >
            <Trash2 className="size-4" />
          </ConfirmButton>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setDialog({ editing: null, parent: null })} className="btn btn-primary">
          <Plus className="size-[18px]" /> Yangi kategoriya
        </button>
      </div>
      {tree.length === 0 ? (
        <EmptyState icon={<FolderTree className="size-6" />} title="Kategoriya yoʻq" text="Masalan: Apple, iPhone, Mac, PC, Audio…" />
      ) : (
        <div className="space-y-3">
          {tree.map((root, i) => (
            <div key={root.id} className="overflow-hidden rounded-[22px] bg-white shadow-card">
              {row(root, 0, i, tree.length)}
              {root.children.length > 0 && (
                <div className="divide-y divide-line border-t border-line">
                  {root.children.map((child, j) => row(child, 1, j, root.children.length))}
                </div>
              )}
              <div className="border-t border-line px-4 py-2 sm:pl-14">
                <button type="button" onClick={() => setDialog({ editing: null, parent: root.id })} className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                  <Plus className="size-3.5" /> «{root.name.uz}» ichiga kategoriya
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {dialog && (
        <CategoryDialog
          open
          onClose={close}
          editing={dialog.editing}
          defaultParent={dialog.parent}
          roots={tree}
        />
      )}
    </div>
  );
}
