import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { FlashToast, StatusPill } from "@/components/admin/ui";
import { brandOptions, categoryOptions } from "@/lib/admin/options";
import { getProductById, productToInput, queryProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductById(Number((await params).id));
  return { title: product ? product.name.uz : "Mahsulot" };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  const { created } = await searchParams;
  const product = Number.isInteger(id) ? getProductById(id) : null;
  if (!product) notFound();
  const settings = getSettings();
  const products = queryProducts({ includeDrafts: true, limit: 500, sort: "new" }).items.map((p) => ({ id: p.id, name: p.name.uz }));
  return (
    <div>
      <FlashToast message={created ? "Mahsulot saqlandi" : undefined} />
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink">
        <ChevronLeft className="size-4" /> Mahsulotlar
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{product.name.uz}</h1>
        {product.status === "draft" && <StatusPill tone="muted">Qoralama</StatusPill>}
        {product.isDemo && <StatusPill tone="warn">demo</StatusPill>}
        <span className="text-[13px] text-muted">{product.views} marta koʻrilgan</span>
      </div>
      <ProductForm
        key={product.updatedAt}
        id={product.id}
        initial={productToInput(product)}
        categories={categoryOptions()}
        brands={brandOptions()}
        products={products}
        currency={settings.currency}
        viewHref={product.status === "published" ? `/uz/product/${product.slug}` : undefined}
      />
    </div>
  );
}
