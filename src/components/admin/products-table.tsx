"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { bulkProductsAction, toggleProductAction } from "@/app/(admin)/admin/_actions/products";
import { Img } from "@/components/img";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmButton, Spinner, StatusPill, Toggle, useToast } from "./ui";

export type ProductRow = {
  id: number;
  name: string;
  slug: string;
  image: ImageAsset | null;
  category: string;
  brand: string;
  variants: number;
  price: string;
  old?: string;
  pct: number;
  stock: { label: string; tone: "ok" | "warn" | "muted" };
  published: boolean;
  isNew: boolean;
  isHit: boolean;
  isDemo: boolean;
  updated: string;
};

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const all = rows.length > 0 && selected.length === rows.length;
  const run = (fn: () => Promise<void>, message: string) =>
    startTransition(async () => {
      await fn();
      toast(message);
      router.refresh();
    });

  const flag = (row: ProductRow, field: "status" | "isNew" | "isHit", value: boolean) => {
    setOptimistic((o) => ({ ...o, [`${row.id}:${field}`]: value }));
    startTransition(async () => {
      await toggleProductAction(row.id, field, value);
      router.refresh();
    });
  };
  const val = (row: ProductRow, field: "status" | "isNew" | "isHit", fallback: boolean) =>
    optimistic[`${row.id}:${field}`] ?? fallback;

  return (
    <div className="rounded-[22px] bg-white shadow-card">
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-accent-soft/50 px-4 py-3 text-[14px]">
          <b>{selected.length} ta tanlandi</b>
          <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => run(() => bulkProductsAction(selected, "publish"), "Saytga chiqarildi")}>
            Saytda koʻrsatish
          </button>
          <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => run(() => bulkProductsAction(selected, "draft"), "Yashirildi")}>
            Yashirish
          </button>
          <ConfirmButton
            className="btn btn-sm bg-sale-soft text-sale"
            title="Tanlanganlarni oʻchirish"
            text={`${selected.length} ta mahsulot va ularning rasmlari butunlay oʻchiriladi.`}
            onConfirm={async () => {
              await bulkProductsAction(selected, "delete");
              setSelected([]);
              toast("Oʻchirildi");
              router.refresh();
            }}
          >
            Oʻchirish
          </ConfirmButton>
          <button type="button" className="ml-auto text-[13px] font-medium text-muted" onClick={() => setSelected([])}>
            Bekor qilish
          </button>
          {pending && <Spinner />}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-[14px]">
          <thead className="text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-muted">
            <tr className="border-b border-line">
              <th className="w-10 py-3 pl-4">
                <input
                  type="checkbox"
                  checked={all}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                  className="size-4 accent-[#1d1d1f]"
                  aria-label="Hammasini tanlash"
                />
              </th>
              <th className="py-3 pl-2">Mahsulot</th>
              <th className="py-3">Narx</th>
              <th className="py-3">Mavjudligi</th>
              <th className="py-3 text-center">Yangi</th>
              <th className="py-3 text-center">Xit</th>
              <th className="py-3 text-center">Saytda</th>
              <th className="py-3 pr-4 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={cn("transition hover:bg-[#fafafc]", !val(r, "status", r.published) && "text-muted")}>
                <td className="py-2.5 pl-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                    className="size-4 accent-[#1d1d1f]"
                    aria-label={`${r.name} tanlash`}
                  />
                </td>
                <td className="py-2.5 pl-2">
                  <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                    <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-canvas ring-1 ring-line">
                      {r.image && <Img asset={r.image} alt="" width={320} sizes="48px" className="size-full object-contain p-1" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold text-ink hover:text-accent">{r.name}</span>
                        {r.isDemo && <StatusPill tone="warn">demo</StatusPill>}
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {[r.category, r.brand, r.variants ? `${r.variants} ta variant` : ""].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="py-2.5 tabular">
                  <div className={cn("font-semibold", r.old ? "text-sale" : "text-ink")}>{r.price}</div>
                  {r.old && (
                    <div className="flex items-center gap-1.5 text-[12px] text-subtle">
                      <span className="line-through">{r.old}</span>
                      <span className="font-bold text-sale">−{r.pct}%</span>
                    </div>
                  )}
                </td>
                <td className="py-2.5">
                  <StatusPill tone={r.stock.tone}>{r.stock.label}</StatusPill>
                </td>
                <td className="py-2.5">
                  <div className="flex justify-center">
                    <Toggle checked={val(r, "isNew", r.isNew)} onChange={(v) => flag(r, "isNew", v)} />
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex justify-center">
                    <Toggle checked={val(r, "isHit", r.isHit)} onChange={(v) => flag(r, "isHit", v)} />
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex justify-center">
                    <Toggle checked={val(r, "status", r.published)} onChange={(v) => flag(r, "status", v)} />
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex justify-end gap-1">
                    <a href={`/uz/product/${r.slug}`} target="_blank" aria-label="Saytda koʻrish" title="Saytda koʻrish" className="grid size-9 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                      <Eye className="size-[18px]" />
                    </a>
                    <Link href={`/admin/products/${r.id}`} aria-label="Tahrirlash" title="Tahrirlash" className="grid size-9 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                      <Pencil className="size-[18px]" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
