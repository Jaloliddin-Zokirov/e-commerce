"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { discountPercent } from "@/lib/format";
import { variantLabel } from "@/lib/product-utils";
import { STOCK_STATUSES, type ProductOption, type ProductVariant, type StockStatus } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { FieldError, MoneyInput, Toggle } from "./ui";

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "Sotuvda bor",
  preorder: "Buyurtma asosida",
  soon: "Tez kunda",
  out_of_stock: "Sotuvda yoʻq",
};

const COLOR_PRESETS: { uz: string; ru: string; hex: string }[] = [
  { uz: "Qora", ru: "Чёрный", hex: "#2c2c2e" },
  { uz: "Oq", ru: "Белый", hex: "#f4f4f2" },
  { uz: "Kumushrang", ru: "Серебристый", hex: "#e3e4e6" },
  { uz: "Space Gray", ru: "Space Gray", hex: "#6e6f73" },
  { uz: "Oltinrang", ru: "Золотой", hex: "#e8d9bd" },
  { uz: "Koʻk", ru: "Синий", hex: "#5b8fc7" },
  { uz: "Havorang", ru: "Голубой", hex: "#bcd3e6" },
  { uz: "Yashil", ru: "Зелёный", hex: "#7fb89a" },
  { uz: "Pushti", ru: "Розовый", hex: "#e7a3a8" },
  { uz: "Binafsha", ru: "Фиолетовый", hex: "#c4b5d8" },
  { uz: "Toʻq sariq", ru: "Оранжевый", hex: "#f2793a" },
  { uz: "Qizil", ru: "Красный", hex: "#d0312d" },
];

const STORAGE_PRESETS = [
  ["64 GB", "64 ГБ"],
  ["128 GB", "128 ГБ"],
  ["256 GB", "256 ГБ"],
  ["512 GB", "512 ГБ"],
  ["1 TB", "1 ТБ"],
  ["2 TB", "2 ТБ"],
];

const OPTION_PRESETS: { label: string; option: () => ProductOption }[] = [
  { label: "Rang", option: () => ({ id: uid(6), name: { uz: "Rang", ru: "Цвет" }, kind: "color", values: [] }) },
  { label: "Xotira", option: () => ({ id: uid(6), name: { uz: "Xotira", ru: "Память" }, kind: "text", values: [] }) },
  {
    label: "Konfiguratsiya",
    option: () => ({ id: uid(6), name: { uz: "Konfiguratsiya", ru: "Конфигурация" }, kind: "text", values: [] }),
  },
  { label: "Oʻlcham", option: () => ({ id: uid(6), name: { uz: "Oʻlcham", ru: "Размер" }, kind: "text", values: [] }) },
  { label: "Boshqa", option: () => ({ id: uid(6), name: { uz: "", ru: "" }, kind: "text", values: [] }) },
];

const small = "h-10 min-h-0 rounded-[10px] px-3 text-[14px]";

export function OptionsEditor({
  options,
  onChange,
  errors,
}: {
  options: ProductOption[];
  onChange: (next: ProductOption[]) => void;
  errors: Record<string, string>;
}) {
  const update = (id: string, patch: Partial<ProductOption>) =>
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const moveValue = (opt: ProductOption, index: number, dir: -1 | 1) => {
    const values = [...opt.values];
    const target = index + dir;
    if (target < 0 || target >= values.length) return;
    [values[index], values[target]] = [values[target], values[index]];
    update(opt.id, { values });
  };

  return (
    <div className="space-y-4">
      {options.map((opt) => {
        const existingLabels = new Set(opt.values.map((v) => v.label.uz.toLowerCase()));
        return (
          <div key={opt.id} className="rounded-2xl bg-[#fafafc] p-4 ring-1 ring-line">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={cn("field w-40 font-semibold", small)}
                value={opt.name.uz}
                placeholder="Nomi (UZ)"
                aria-label="Variant nomi (UZ)"
                onChange={(e) => update(opt.id, { name: { ...opt.name, uz: e.target.value } })}
              />
              <input
                className={cn("field w-40", small)}
                value={opt.name.ru}
                placeholder="Nomi (RU)"
                aria-label="Variant nomi (RU)"
                onChange={(e) => update(opt.id, { name: { ...opt.name, ru: e.target.value } })}
              />
              <select
                className={cn("field w-auto", small)}
                value={opt.kind}
                onChange={(e) => update(opt.id, { kind: e.target.value as ProductOption["kind"] })}
                aria-label="Turi"
              >
                <option value="color">Rang (namuna bilan)</option>
                <option value="text">Matn</option>
              </select>
              <button
                type="button"
                onClick={() => onChange(options.filter((o) => o.id !== opt.id))}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-sale hover:bg-sale-soft"
              >
                <Trash2 className="size-4" /> Oʻchirish
              </button>
            </div>
            <FieldError error={errors[`options.${opt.id}`]} />

            <div className="mt-3 space-y-2">
              {opt.values.map((val, i) => (
                <div key={val.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  {opt.kind === "color" && (
                    <label className="relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full ring-1 ring-line" title="Rangni tanlang">
                      <span className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={{ backgroundColor: val.hex ?? "#cccccc" }} />
                      <input
                        type="color"
                        value={val.hex ?? "#cccccc"}
                        onChange={(e) =>
                          update(opt.id, { values: opt.values.map((v) => (v.id === val.id ? { ...v, hex: e.target.value } : v)) })
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Rang"
                      />
                    </label>
                  )}
                  <input
                    className={cn("field min-w-0 flex-1", small)}
                    value={val.label.uz}
                    placeholder={opt.kind === "color" ? "Masalan: Cosmic Orange" : "Masalan: 256 GB"}
                    aria-label="Qiymat (UZ)"
                    onChange={(e) =>
                      update(opt.id, {
                        values: opt.values.map((v) => (v.id === val.id ? { ...v, label: { ...v.label, uz: e.target.value } } : v)),
                      })
                    }
                  />
                  <input
                    className={cn("field min-w-0 flex-1", small)}
                    value={val.label.ru}
                    placeholder="RU (ixtiyoriy)"
                    aria-label="Qiymat (RU)"
                    onChange={(e) =>
                      update(opt.id, {
                        values: opt.values.map((v) => (v.id === val.id ? { ...v, label: { ...v.label, ru: e.target.value } } : v)),
                      })
                    }
                  />
                  <div className="flex shrink-0 gap-0.5">
                    <button type="button" onClick={() => moveValue(opt, i, -1)} disabled={i === 0} aria-label="Yuqoriga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveValue(opt, i, 1)} disabled={i === opt.values.length - 1} aria-label="Pastga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30">
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update(opt.id, { values: opt.values.filter((v) => v.id !== val.id) })}
                      aria-label="Qiymatni oʻchirish"
                      className="grid size-9 place-items-center rounded-lg text-sale hover:bg-sale-soft"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  update(opt.id, {
                    values: [...opt.values, { id: uid(6), label: { uz: "", ru: "" }, ...(opt.kind === "color" ? { hex: "#cccccc" } : {}) }],
                  })
                }
                className="inline-flex h-8 items-center gap-1 rounded-full bg-ink px-3 text-[12.5px] font-semibold text-white"
              >
                <Plus className="size-3.5" /> Qiymat
              </button>
              {(opt.kind === "color" ? COLOR_PRESETS.map((c) => ({ uz: c.uz, ru: c.ru, hex: c.hex })) : /xotira|память|sig/i.test(opt.name.uz + opt.name.ru) ? STORAGE_PRESETS.map(([uz, ru]) => ({ uz, ru, hex: undefined })) : [])
                .filter((p) => !existingLabels.has(p.uz.toLowerCase()))
                .map((p) => (
                  <button
                    key={p.uz}
                    type="button"
                    onClick={() =>
                      update(opt.id, { values: [...opt.values, { id: uid(6), label: { uz: p.uz, ru: p.ru }, ...(p.hex ? { hex: p.hex } : {}) }] })
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-medium ring-1 ring-line hover:ring-ink-2"
                  >
                    {p.hex && <span className="size-3 rounded-full ring-1 ring-black/15" style={{ backgroundColor: p.hex }} />}+ {p.uz}
                  </button>
                ))}
            </div>
          </div>
        );
      })}

      {options.length < 4 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-muted">Variant turi qoʻshish:</span>
          {OPTION_PRESETS.filter((p) => p.label === "Boshqa" || !options.some((o) => o.name.uz === p.label)).map((p) => (
            <button key={p.label} type="button" onClick={() => onChange([...options, p.option()])} className="chip min-h-9 gap-1">
              <Plus className="size-3.5" /> {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VariantsTable({
  options,
  variants,
  onChange,
  suffix,
  error,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  onChange: (next: ProductVariant[]) => void;
  suffix: string;
  error?: string;
}) {
  const [bulk, setBulk] = useState<{ price: number | null; oldPrice: number | null; stock: StockStatus | "" }>({
    price: null,
    oldPrice: null,
    stock: "",
  });
  const usable = options.filter((o) => o.values.length > 0);
  if (usable.length === 0) {
    return <p className="rounded-2xl bg-canvas px-4 py-3 text-[13px] text-muted">Variantlar jadvali paydo boʻlishi uchun yuqorida qiymatlar qoʻshing.</p>;
  }
  const patch = (id: string, p: Partial<ProductVariant>) => onChange(variants.map((v) => (v.id === id ? { ...v, ...p } : v)));
  const applyBulk = () =>
    onChange(
      variants.map((v) => ({
        ...v,
        ...(bulk.price !== null ? { price: bulk.price } : {}),
        ...(bulk.oldPrice !== null ? { oldPrice: bulk.oldPrice || null } : {}),
        ...(bulk.stock ? { stock: bulk.stock } : {}),
      })),
    );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2 rounded-2xl bg-accent-soft/60 p-3">
        <div className="text-[12.5px] font-semibold text-accent sm:w-full">Barcha variantlarga birdaniga:</div>
        <MoneyInput value={bulk.price} onChange={(v) => setBulk({ ...bulk, price: v })} placeholder="Narx" suffix={suffix} className="w-36" aria-label="Hammasiga narx" />
        <MoneyInput value={bulk.oldPrice} onChange={(v) => setBulk({ ...bulk, oldPrice: v })} placeholder="Eski narx" suffix={suffix} className="w-36" aria-label="Hammasiga eski narx" />
        <select className="field h-11 w-auto" value={bulk.stock} onChange={(e) => setBulk({ ...bulk, stock: e.target.value as StockStatus | "" })} aria-label="Hammasiga holat">
          <option value="">Holat — oʻzgarmasin</option>
          {STOCK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STOCK_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="button" onClick={applyBulk} className="btn btn-accent btn-sm h-11">
          Qoʻllash
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-line">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead className="bg-[#fafafc] text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-muted">
            <tr>
              <th className="px-3 py-2.5">Variant</th>
              <th className="px-2 py-2.5">Narx</th>
              <th className="px-2 py-2.5">Eski narx (chiziladi)</th>
              <th className="px-2 py-2.5">Holat</th>
              <th className="px-3 py-2.5 text-right">Faol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {variants.map((v) => {
              const pct = discountPercent(v.price, v.oldPrice);
              const color = usable.find((o) => o.kind === "color");
              const hex = color?.values.find((x) => x.id === v.values[color.id])?.hex;
              const invalidOld = v.oldPrice !== null && v.oldPrice > 0 && v.oldPrice <= v.price;
              return (
                <tr key={v.id} className={cn(!v.enabled && "bg-canvas/70 text-muted")}>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 font-medium">
                      {hex && <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15" style={{ backgroundColor: hex }} />}
                      {variantLabel(usable, v, "uz") || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <MoneyInput value={v.price} onChange={(n) => patch(v.id, { price: n ?? 0 })} suffix={suffix} className="w-36" aria-label="Narx" />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <MoneyInput
                        value={v.oldPrice}
                        onChange={(n) => patch(v.id, { oldPrice: n })}
                        suffix={suffix}
                        className="w-36"
                        invalid={invalidOld}
                        aria-label="Eski narx"
                      />
                      {pct > 0 && <span className="rounded-full bg-sale px-2 py-0.5 text-[11.5px] font-bold text-white">−{pct}%</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select className="field h-10 min-h-0 w-auto py-0 text-[13.5px]" value={v.stock} onChange={(e) => patch(v.id, { stock: e.target.value as StockStatus })} aria-label="Holat">
                      {STOCK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STOCK_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Toggle checked={v.enabled} onChange={(on) => patch(v.id, { enabled: on })} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <FieldError error={error} />
      <p className="mt-2 text-[12.5px] text-muted">
        Faol boʻlmagan variantlar saytda koʻrinmaydi. Eski narx kiritilsa, saytda u ustidan chizilib, chegirma foizi koʻrsatiladi.
      </p>
    </div>
  );
}
