import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { ProductsTable, type ProductRow } from "@/components/admin/products-table";
import { EmptyState, FlashToast, PageHeader } from "@/components/admin/ui";
import { categoryOptions } from "@/lib/admin/options";
import { displayPrice, priceCtx } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { bestStock, offers } from "@/lib/product-utils";
import { listBrands } from "@/lib/repo/brands";
import { descendantIds, listCategories } from "@/lib/repo/categories";
import { queryProducts, type ProductQuery } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";
import { cn } from "@/lib/utils";
import { STOCK_TONE } from "@/lib/view";

export const metadata: Metadata = { title: "Mahsulotlar" };

const FILTERS = [
  { key: "", label: "Hammasi" },
  { key: "published", label: "Saytda" },
  { key: "draft", label: "Qoralama" },
  { key: "sale", label: "Chegirmada" },
  { key: "out", label: "Sotuvda yoʻq" },
] as const;

const PER_PAGE = 50;

type Props = { searchParams: Promise<{ q?: string; filter?: string; cat?: string; page?: string; deleted?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const settings = getSettings();
  const ctx = priceCtx(settings, "uz");
  const dict = getDict("uz");
  const categories = listCategories();
  const brands = new Map(listBrands().map((b) => [b.id, b.name]));
  const page = Math.max(1, Number(sp.page) || 1);
  const catId = Number(sp.cat) || null;

  const query: ProductQuery = {
    includeDrafts: true,
    q: sp.q,
    sort: "new",
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
    categoryIds: catId ? descendantIds(catId, categories) : undefined,
    status: sp.filter === "published" ? "published" : sp.filter === "draft" ? "draft" : undefined,
    onSale: sp.filter === "sale" || undefined,
    stock: sp.filter === "out" ? "out_of_stock" : undefined,
  };
  const { items, total } = queryProducts(query);
  const pages = Math.ceil(total / PER_PAGE);

  const rows: ProductRow[] = items.map((p) => {
    const status = bestStock(offers(p));
    return {
      id: p.id,
      name: p.name.uz,
      slug: p.slug,
      image: p.images[0] ?? null,
      category: categories.find((c) => c.id === p.categoryId)?.name.uz ?? "",
      brand: p.brandId ? brands.get(p.brandId) ?? "" : "",
      variants: p.options.length ? p.variants.filter((v) => v.enabled).length : 0,
      price: p.minPrice > 0 ? `${p.maxPrice > p.minPrice ? "dan " : ""}${displayPrice(p.minPrice, ctx).main}` : "Narxini soʻrang",
      old: p.minOldPrice ? displayPrice(p.minOldPrice, ctx).main : undefined,
      pct: p.discountPct,
      stock: { label: dict.stock[status], tone: STOCK_TONE[status] },
      published: p.status === "published",
      isNew: p.isNew,
      isHit: p.isHit,
      isDemo: p.isDemo,
      updated: p.updatedAt,
    };
  });

  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: sp.q, filter: sp.filter, cat: sp.cat, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <div>
      <FlashToast message={sp.deleted ? "Mahsulot oʻchirildi" : undefined} />
      <PageHeader
        title="Mahsulotlar"
        subtitle={`Jami ${total} ta`}
        actions={
          <Link href="/admin/products/new" className="btn btn-primary">
            <Plus className="size-[18px]" /> Yangi mahsulot
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <Link key={f.key} href={qs({ filter: f.key || undefined, page: undefined })} className="chip min-h-9" data-active={(sp.filter ?? "") === f.key}>
              {f.label}
            </Link>
          ))}
        </div>
        <form className="ml-auto flex flex-wrap items-center gap-2" action="/admin/products">
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          <select name="cat" defaultValue={sp.cat ?? ""} className="field h-10 min-h-0 w-auto rounded-full py-0 text-[14px]" aria-label="Kategoriya">
            <option value="">Barcha kategoriyalar</option>
            {categoryOptions().map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input name="q" defaultValue={sp.q} placeholder="Nomi yoki artikul…" className="field h-10 min-h-0 w-56 rounded-full pl-10 text-[14px]" />
          </div>
          <button type="submit" className="btn btn-sm btn-primary h-10">
            Qidirish
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title={sp.q || sp.filter || sp.cat ? "Hech narsa topilmadi" : "Hali mahsulot yoʻq"}
          text={sp.q || sp.filter || sp.cat ? "Filtrlarni oʻzgartirib koʻring." : "Birinchi mahsulotni qoʻshing — bu bir necha daqiqa oladi."}
          action={
            <Link href="/admin/products/new" className="btn btn-primary">
              <Plus className="size-[18px]" /> Mahsulot qoʻshish
            </Link>
          }
        />
      ) : (
        <ProductsTable rows={rows} />
      )}

      {pages > 1 && (
        <nav className="mt-6 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={qs({ page: p > 1 ? String(p) : undefined })}
              className={cn("grid h-10 min-w-10 place-items-center rounded-full px-3 text-[14px] font-medium", p === page ? "bg-ink text-white" : "bg-white hover:bg-line")}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
