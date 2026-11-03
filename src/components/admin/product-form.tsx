"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteProductAction,
  duplicateProductAction,
  saveProductAction,
} from "@/app/(admin)/admin/_actions/products";
import { ProductCard } from "@/components/site/product-card";
import { SiteProvider } from "@/components/site/site-context";
import { discountPercent, displayPrice, type PriceCtx } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { buildVariants, deriveProduct } from "@/lib/product-utils";
import type { ProductInput } from "@/lib/repo/products";
import { slugify } from "@/lib/slug";
import { CONDITIONS, STOCK_STATUSES, type Product, type SiteSettings } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { toCard } from "@/lib/view";
import { ImageGalleryInput } from "./image-upload";
import { SpecsEditor } from "./specs-editor";
import { Card, ConfirmButton, FieldError, Label, LocalizedField, MoneyInput, Spinner, TextField, Toggle, useToast } from "./ui";
import { OptionsEditor, STOCK_LABELS, VariantsTable } from "./variants-editor";

const CONDITION_LABELS = { new: "Yangi", refurbished: "Refurbished (qayta tiklangan)", used: "Ishlatilgan" };

export type ProductFormProps = {
  id: number | null;
  initial: ProductInput;
  categories: { id: number; label: string }[];
  brands: { id: number; name: string }[];
  products: { id: number; name: string }[];
  currency: SiteSettings["currency"];
  viewHref?: string;
};

export function ProductForm({ id, initial, categories, brands, products, currency, viewHref }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<ProductInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const saveRef = useRef<() => void>(() => {});

  const set = useCallback(<K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }, []);

  const suffix = currency.base === "USD" ? "$" : "soʻm";
  const ctx: PriceCtx = useMemo(
    () => ({ ...currency, locale: "uz", installment: { enabled: false, months: 12, markup: 0 } }),
    [currency],
  );

  // Options drive the variants table; keep prices of combinations that still exist.
  const setOptions = (options: ProductInput["options"]) => {
    setForm((f) => ({
      ...f,
      options,
      variants: buildVariants(options, f.variants, { price: f.price, oldPrice: f.oldPrice, stock: f.stock }, () => uid(6)),
    }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setErrors({});
    try {
      const res = await saveProductAction(id, form);
      if (!res.ok) {
        setErrors(res.errors);
        toast(res.message, "error");
        return;
      }
      setDirty(false);
      if (!id) {
        router.replace(`/admin/products/${res.id}?created=1`);
      } else {
        setForm((f) => ({ ...f, slug: res.slug }));
        toast("Saqlandi");
        router.refresh();
      }
    } catch {
      toast("Saqlab boʻlmadi. Sahifani yangilab, qayta urinib koʻring.", "error");
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    saveRef.current = save;
  });

  const hasVariants = form.options.some((o) => o.values.length > 0);
  const colorValues = form.options.find((o) => o.kind === "color")?.values.map((v) => ({ id: v.id, label: v.label.uz, hex: v.hex })) ?? [];
  const pct = discountPercent(form.price, form.oldPrice);
  const preview = displayPrice(form.price, ctx);

  const previewCard = useMemo(() => {
    const derived = deriveProduct(form);
    const product = {
      ...form,
      id: id ?? 0,
      ...derived,
      views: 0,
      isDemo: false,
      createdAt: "",
      updatedAt: "",
    } as Product;
    return { ...toCard(product, "uz", ctx), href: "#" };
  }, [form, id, ctx]);

  const siteValue = useMemo(
    () => ({ locale: "uz" as const, dict: getDict("uz"), price: ctx, storeName: "", phones: [], telegramUser: "", siteUrl: "" }),
    [ctx],
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
        {saving ? <Spinner /> : <Save className="size-[18px]" />}
        Saqlash
      </button>
      {viewHref && (
        <Link href={viewHref} target="_blank" className="btn btn-outline">
          <ExternalLink className="size-4" /> Saytda koʻrish
        </Link>
      )}
    </div>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <Card title="Asosiy maʼlumotlar">
          <div className="space-y-4">
            <LocalizedField
              label="Mahsulot nomi"
              required
              value={form.name}
              error={errors["name.uz"]}
              placeholder={{ uz: "Masalan: iPhone 17 Pro" }}
              onChange={(v) => {
                setForm((f) => ({ ...f, name: v, slug: slugTouched ? f.slug : slugify(v.uz) }));
                setDirty(true);
              }}
            />
            <LocalizedField
              label="Qisqa shior"
              hint="Kartochkada nom ostida chiqadi"
              value={form.tagline}
              placeholder={{ uz: "Masalan: Uchta 48 MP kamera. A19 Pro." }}
              onChange={(v) => set("tagline", v)}
            />
          </div>
        </Card>

        <Card title="Rasmlar" description="Mahsulot rasmlari oq yoki shaffof fonda boʻlsa, sayt yanada chiroyli koʻrinadi.">
          <ImageGalleryInput value={form.images} onChange={(v) => set("images", v)} colors={colorValues} />
        </Card>

        <Card
          title="Narx va mavjudlik"
          description={
            <>
              Narxlar <b>{currency.base === "USD" ? "dollarda ($ / y.e.)" : "soʻmda"}</b> kiritiladi
              {currency.base === "USD" && currency.display !== "USD" && (
                <> va saytda kurs boʻyicha soʻmda koʻrsatiladi (1 $ = {currency.rate.toLocaleString("ru-RU")} soʻm)</>
              )}
              .{" "}
              <Link href="/admin/settings#currency" className="text-accent hover:underline">
                Valyuta sozlamalari
              </Link>
            </>
          }
        >
          {hasVariants ? (
            <p className="rounded-2xl bg-accent-soft px-4 py-3 text-[13.5px] text-accent">
              Bu mahsulotda variantlar bor — har bir variantning narxi pastdagi <b>Variantlar</b> jadvalida belgilanadi.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <Label required hint="0 = «Narxini soʻrang»">
                    Narx
                  </Label>
                  <MoneyInput value={form.price} onChange={(v) => set("price", v ?? 0)} suffix={suffix} aria-label="Narx" />
                </label>
                <label className="block">
                  <Label hint="ixtiyoriy">Eski narx (ustidan chiziladi)</Label>
                  <MoneyInput
                    value={form.oldPrice}
                    onChange={(v) => set("oldPrice", v)}
                    suffix={suffix}
                    invalid={Boolean(errors.oldPrice)}
                    aria-label="Eski narx"
                  />
                  <FieldError error={errors.oldPrice} />
                </label>
                <label className="block">
                  <Label>Mavjudligi</Label>
                  <select className="field" value={form.stock} onChange={(e) => set("stock", e.target.value as ProductInput["stock"])}>
                    {STOCK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STOCK_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-muted">Tez chegirma:</span>
                {[5, 10, 15, 20, 25, 30].map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={!form.price && !form.oldPrice}
                    onClick={() => {
                      const base = form.oldPrice && form.oldPrice > form.price ? form.oldPrice : form.price;
                      const next = currency.base === "UZS" ? Math.round((base * (1 - p / 100)) / 1000) * 1000 : Math.round(base * (1 - p / 100));
                      setForm((f) => ({ ...f, oldPrice: base, price: next }));
                      setDirty(true);
                    }}
                    className="chip min-h-8 text-[13px] disabled:opacity-40"
                  >
                    −{p}%
                  </button>
                ))}
                {form.oldPrice !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, price: f.oldPrice && f.oldPrice > f.price ? f.oldPrice : f.price, oldPrice: null }));
                      setDirty(true);
                    }}
                    className="chip min-h-8 text-[13px] text-sale"
                  >
                    Chegirmani olib tashlash
                  </button>
                )}
              </div>
              {form.price > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-canvas px-4 py-3">
                  <span className="text-[12.5px] text-muted">Saytda:</span>
                  <span className={cn("text-[18px] font-bold tabular", pct ? "text-sale" : "text-ink")}>{preview.main}</span>
                  {pct > 0 && form.oldPrice && (
                    <>
                      <span className="text-[14px] text-subtle line-through tabular">{displayPrice(form.oldPrice, ctx).main}</span>
                      <span className="rounded-full bg-sale px-2 py-0.5 text-[12px] font-bold text-white">−{pct}%</span>
                    </>
                  )}
                  {preview.alt && <span className="text-[13px] text-muted">≈ {preview.alt}</span>}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card
          title="Variantlar"
          description="Rang, xotira yoki konfiguratsiya boʻyicha turlicha narxlar boʻlsa, variant qoʻshing. Boʻlmasa — boʻsh qoldiring."
        >
          <OptionsEditor options={form.options} onChange={setOptions} errors={errors} />
          {hasVariants && (
            <div className="mt-5">
              <VariantsTable
                options={form.options}
                variants={form.variants}
                onChange={(v) => set("variants", v)}
                suffix={suffix}
                error={errors.variants}
              />
            </div>
          )}
        </Card>

        <Card
          title="Tavsif"
          description={
            <>
              Boʻsh qator — yangi xatboshi, <code className="rounded bg-canvas px-1">- </code> bilan boshlangan qator — roʻyxat,{" "}
              <code className="rounded bg-canvas px-1">**qalin**</code>, <code className="rounded bg-canvas px-1">## </code> — sarlavha.
            </>
          }
        >
          <LocalizedField label="Mahsulot tavsifi" multiline rows={9} value={form.description} onChange={(v) => set("description", v)} />
        </Card>

        <Card title="Xarakteristikalar" description="Saytda jadval koʻrinishida chiqadi. Qiymat (RU) boʻsh qolsa, oʻzbekchasi ishlatiladi.">
          <SpecsEditor specs={form.specs} onChange={(v) => set("specs", v)} products={products.filter((p) => p.id !== id)} />
        </Card>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <div className="space-y-4">
            <Toggle
              checked={form.status === "published"}
              onChange={(on) => set("status", on ? "published" : "draft")}
              label={form.status === "published" ? "Saytda koʻrinadi" : "Qoralama (yashirin)"}
              description="Oʻchirilsa, mahsulot saytda koʻrinmaydi"
            />
            {actions}
            {dirty && <p className="text-[12.5px] font-medium text-warn">Saqlanmagan oʻzgarishlar bor (⌘/Ctrl + S)</p>}
          </div>
        </Card>

        <Card title="Saytda shunday koʻrinadi">
          <SiteProvider value={siteValue}>
            <div className="pointer-events-none mx-auto max-w-[240px] rounded-[24px] bg-canvas p-2">
              <ProductCard card={previewCard} />
            </div>
          </SiteProvider>
        </Card>

        <Card title="Turkumlash">
          <div className="space-y-4">
            <label className="block">
              <Label>Kategoriya</Label>
              <select
                className="field"
                value={form.categoryId ?? ""}
                onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Tanlanmagan —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label hint={<Link href="/admin/brands" className="text-accent">+ brend</Link>}>Brend</Label>
              <select className="field" value={form.brandId ?? ""} onChange={(e) => set("brandId", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Tanlanmagan —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>Holati</Label>
              <select className="field" value={form.condition} onChange={(e) => set("condition", e.target.value as ProductInput["condition"])}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <TextField label="Artikul (SKU)" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ixtiyoriy" />
            <LocalizedField label="Kafolat" value={form.warranty} placeholder={{ uz: "1 yil rasmiy kafolat" }} onChange={(v) => set("warranty", v)} />
          </div>
        </Card>

        <Card title="Belgilar va tartib">
          <div className="space-y-4">
            <Toggle checked={form.isNew} onChange={(v) => set("isNew", v)} label="Yangi" description="«Yangi» belgisi va «Yangi kelganlar» boʻlimi" />
            <Toggle checked={form.isHit} onChange={(v) => set("isHit", v)} label="Xit" description="«Koʻp soʻraladi» boʻlimida chiqadi" />
            <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Tavsiya etamiz" description="Bosh sahifadagi tavsiyalar" />
            <TextField
              label="Tartib raqami"
              hint="kichigi oldinda"
              type="number"
              value={form.sort}
              onChange={(e) => set("sort", Math.round(Number(e.target.value) || 0))}
            />
          </div>
        </Card>

        <Card title="Havola (URL)">
          <TextField
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }}
            placeholder="iphone-17-pro"
            hint="lotin harflari"
          />
          <p className="mt-2 break-all text-[12px] text-muted">/uz/product/{form.slug || "…"}</p>
        </Card>

        {id && (
          <Card>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={async () => {
                  const res = await duplicateProductAction(id);
                  if (res) router.push(`/admin/products/${res.id}?created=1`);
                }}
              >
                <Copy className="size-4" /> Nusxa yaratish
              </button>
              <ConfirmButton
                className="btn btn-sm bg-sale-soft text-sale hover:bg-[#fbdcdc]"
                title="Mahsulotni oʻchirish"
                text={`«${form.name.uz}» va uning rasmlari butunlay oʻchiriladi.`}
                onConfirm={async () => {
                  await deleteProductAction(id);
                  setDirty(false);
                  router.replace("/admin/products?deleted=1");
                }}
              >
                <Trash2 className="size-4" /> Oʻchirish
              </ConfirmButton>
            </div>
          </Card>
        )}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
        <span className={cn("flex-1 truncate text-[13px]", dirty ? "font-medium text-warn" : "text-muted")}>
          {dirty ? "Saqlanmagan oʻzgarishlar" : form.name.uz || "Yangi mahsulot"}
        </span>
        <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? <Spinner /> : <Save className="size-4" />} Saqlash
        </button>
      </div>
    </div>
  );
}
