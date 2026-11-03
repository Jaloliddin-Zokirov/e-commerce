import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { brandOptions, categoryOptions } from "@/lib/admin/options";
import { queryProducts, type ProductInput } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";

export const metadata: Metadata = { title: "Yangi mahsulot" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const settings = getSettings();
  const empty: ProductInput = {
    slug: "",
    categoryId: Number(cat) || null,
    brandId: null,
    sku: "",
    name: { uz: "", ru: "" },
    tagline: { uz: "", ru: "" },
    description: { uz: "", ru: "" },
    warranty: { uz: "", ru: "" },
    condition: "new",
    price: 0,
    oldPrice: null,
    stock: "in_stock",
    images: [],
    options: [],
    variants: [],
    specs: [],
    isNew: true,
    isHit: false,
    isFeatured: false,
    status: "published",
    sort: 0,
  };
  const products = queryProducts({ includeDrafts: true, limit: 500, sort: "new" }).items.map((p) => ({ id: p.id, name: p.name.uz }));
  return (
    <div>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink">
        <ChevronLeft className="size-4" /> Mahsulotlar
      </Link>
      <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.03em]">Yangi mahsulot</h1>
      <ProductForm
        id={null}
        initial={empty}
        categories={categoryOptions()}
        brands={brandOptions()}
        products={products}
        currency={settings.currency}
      />
    </div>
  );
}
