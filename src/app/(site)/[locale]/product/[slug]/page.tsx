import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/rich-text";
import { ProductBuy, type BuyProps } from "@/components/site/product-buy";
import { ProductCard } from "@/components/site/product-card";
import { Rail, RailItem } from "@/components/site/rail";
import { RecentlyViewed, TrackView } from "@/components/site/recently-viewed";
import { Breadcrumbs, SectionHeader } from "@/components/site/section";
import { SpecHighlights } from "@/components/site/spec-highlights";
import { assetSrc } from "@/lib/asset-url";
import { convert, priceCtx } from "@/lib/format";
import { getDict, href, tl } from "@/lib/i18n";
import { activeVariants, offers } from "@/lib/product-utils";
import { getBrand } from "@/lib/repo/brands";
import { categoryPath, listCategories } from "@/lib/repo/categories";
import { bumpViews, getProductBySlug, queryProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";
import { alternates, categoryHref, siteUrl } from "@/lib/site-data";
import { specHighlights } from "@/lib/spec-highlights";
import { isLocale, type StockStatus } from "@/lib/types";
import { toCard } from "@/lib/view";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ v?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = getProductBySlug(slug);
  if (!product) return {};
  const name = tl(product.name, locale);
  const description =
    tl(product.tagline, locale) ||
    tl(product.description, locale).replace(/\s+/g, " ").slice(0, 160);
  const raster = product.images.find((i) => i.ext === "webp");
  return {
    title: name,
    description,
    alternates: alternates(locale, `/product/${product.slug}`),
    openGraph: {
      title: name,
      description,
      type: "website",
      images: raster ? [{ url: `${siteUrl()}${assetSrc(raster, 1080)}`, width: raster.w, height: raster.h }] : undefined,
    },
  };
}

const SCHEMA_STOCK: Record<StockStatus, string> = {
  in_stock: "https://schema.org/InStock",
  preorder: "https://schema.org/PreOrder",
  soon: "https://schema.org/PreSale",
  out_of_stock: "https://schema.org/OutOfStock",
};

export default async function ProductPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { v } = await searchParams;
  if (!isLocale(locale)) notFound();
  const product = getProductBySlug(slug);
  if (!product) notFound();
  bumpViews(product.id);

  const settings = getSettings();
  const dict = getDict(locale);
  const ctx = priceCtx(settings, locale);
  const categories = listCategories();
  const category = product.categoryId ? categories.find((c) => c.id === product.categoryId) : undefined;
  const chain = category ? categoryPath(category, categories) : [];
  const brand = product.brandId ? getBrand(product.brandId) : null;
  const name = tl(product.name, locale);
  const url = `${siteUrl()}${href(locale, `/product/${product.slug}`)}`;

  const variants = activeVariants(product);
  const buy: BuyProps = {
    id: product.id,
    name,
    tagline: tl(product.tagline, locale),
    brand: brand ? { name: brand.name, href: `${href(locale, "/catalog")}?brand=${brand.id}` } : undefined,
    sku: product.sku,
    warranty: tl(product.warranty, locale),
    badges: [
      ...(product.isNew ? [{ label: dict.badge.new, tone: "new" as const }] : []),
      ...(product.isHit ? [{ label: dict.badge.hit, tone: "hit" as const }] : []),
      ...(product.condition === "refurbished" ? [{ label: dict.badge.refurbished, tone: "refurb" as const }] : []),
      ...(product.condition === "used" ? [{ label: dict.condition.used, tone: "refurb" as const }] : []),
    ],
    url,
    images: product.images,
    options: variants.length
      ? product.options.map((o) => ({
          id: o.id,
          name: tl(o.name, locale),
          kind: o.kind,
          values: o.values.map((val) => ({ id: val.id, label: tl(val.label, locale), hex: val.hex })),
        }))
      : [],
    variants: variants.map((x) => ({ id: x.id, values: x.values, price: x.price, oldPrice: x.oldPrice, stock: x.stock })),
    base: { price: product.price, oldPrice: product.oldPrice, stock: product.stock },
    initialVariantId: v,
    store: { address: tl(settings.address, locale), hours: tl(settings.workHours, locale) },
  };

  const description = tl(product.description, locale);
  const specGroups = product.specs
    .map((g) => ({
      id: g.id,
      title: tl(g.title, locale),
      items: g.items
        .map((item) => ({ label: tl(item.label, locale), value: tl(item.value, locale) }))
        .filter((item) => item.label && item.value),
    }))
    .filter((g) => g.items.length > 0);

  const related = queryProducts({
    categoryIds: product.categoryId ? [product.categoryId] : undefined,
    excludeIds: [product.id],
    limit: 12,
  }).items;
  const relatedCards = (
    related.length >= 4
      ? related
      : [
          ...related,
          ...queryProducts({ excludeIds: [product.id, ...related.map((r) => r.id)], isHit: true, limit: 8 }).items,
        ]
  ).map((p) => toCard(p, locale, ctx));

  const currency = ctx.display === "USD" ? "USD" : "UZS";
  const allOffers = offers(product).filter((o) => o.price > 0);
  const lowest = allOffers.reduce((min, o) => Math.min(min, o.price), Infinity);
  const highest = allOffers.reduce((max, o) => Math.max(max, o.price), 0);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: tl(product.tagline, locale) || description.slice(0, 300),
    sku: product.sku || undefined,
    image: product.images.map((img) => `${siteUrl()}${assetSrc(img, 1080)}`),
    brand: brand ? { "@type": "Brand", name: brand.name } : undefined,
    itemCondition:
      product.condition === "new"
        ? "https://schema.org/NewCondition"
        : product.condition === "refurbished"
          ? "https://schema.org/RefurbishedCondition"
          : "https://schema.org/UsedCondition",
    offers:
      allOffers.length === 0
        ? undefined
        : allOffers.length > 1
          ? {
              "@type": "AggregateOffer",
              priceCurrency: currency,
              lowPrice: convert(lowest, currency, ctx),
              highPrice: convert(highest, currency, ctx),
              offerCount: allOffers.length,
              availability: SCHEMA_STOCK[product.inStock ? "in_stock" : product.stock],
              url,
            }
          : {
              "@type": "Offer",
              priceCurrency: currency,
              price: convert(lowest, currency, ctx),
              availability: SCHEMA_STOCK[allOffers[0].stock],
              url,
            },
  };
  const crumbs = [
    { label: dict.nav.home, href: href(locale) },
    { label: dict.nav.catalog, href: href(locale, "/catalog") },
    ...chain.map((c) => ({ label: tl(c.name, locale), href: categoryHref(locale, c) })),
    { label: name },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.href ? `${siteUrl()}${c.href}` : url,
    })),
  };

  return (
    <div className="pb-28 lg:pb-4">
      <div className="container-page pt-4 lg:pt-6">
        <Breadcrumbs items={crumbs} />
        <div className="mt-4 lg:mt-6">
          <ProductBuy {...buy} />
        </div>

        <div className="mt-10 lg:mt-16">
          <SpecHighlights items={specHighlights(product.specs, locale)} title={dict.product.glance} />
        </div>

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <section id="description" className="rounded-[18px] bg-white p-6 shadow-tile sm:p-8 lg:p-10">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">{dict.product.description}</h2>
            <div className="mt-5">
              {description ? <RichText text={description} /> : <p className="text-muted">{dict.product.noDescription}</p>}
            </div>
            {(brand || category || product.warranty.uz) && (
              <dl className="mt-8 grid gap-3 border-t border-line pt-6 text-[14px] sm:grid-cols-2">
                {brand && (
                  <div>
                    <dt className="text-muted">{dict.product.brand}</dt>
                    <dd className="font-medium">{brand.name}</dd>
                  </div>
                )}
                {category && (
                  <div>
                    <dt className="text-muted">{dict.product.category}</dt>
                    <dd className="font-medium">{tl(category.name, locale)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">{dict.product.condition}</dt>
                  <dd className="font-medium">
                    {dict.condition[product.condition]}
                    <span className="block text-[13px] font-normal text-muted">{dict.conditionHint[product.condition]}</span>
                  </dd>
                </div>
                {tl(product.warranty, locale) && (
                  <div>
                    <dt className="text-muted">{dict.product.warranty}</dt>
                    <dd className="font-medium">{tl(product.warranty, locale)}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          <section id="specs" className="rounded-[18px] bg-white p-6 shadow-tile sm:p-8 lg:p-10">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">{dict.product.specs}</h2>
            {specGroups.length === 0 ? (
              <p className="mt-5 text-muted">{dict.product.noDescription}</p>
            ) : (
              <div className="mt-5 space-y-7">
                {specGroups.map((g) => (
                  <div key={g.id}>
                    {g.title && <h3 className="mb-1 text-[17px] font-semibold tracking-[-0.01em] text-ink">{g.title}</h3>}
                    <dl className="divide-y divide-line border-b border-line">
                      {g.items.map((item, i) => (
                        <div key={`${item.label}-${i}`} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 py-3 text-[14.5px]">
                          <dt className="text-muted">{item.label}</dt>
                          <dd className="text-ink">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {relatedCards.length > 0 && (
        <section className="container-page mt-14 lg:mt-20">
          <SectionHeader
            title={dict.product.related}
            link={category ? { href: categoryHref(locale, category), label: dict.common.viewAll } : undefined}
          />
          <Rail label={dict.product.related}>
            {relatedCards.map((card) => (
              <RailItem key={card.id}>
                <ProductCard card={card} />
              </RailItem>
            ))}
          </Rail>
        </section>
      )}
      <RecentlyViewed excludeId={product.id} />
      <TrackView id={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productLd, breadcrumbLd]).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
