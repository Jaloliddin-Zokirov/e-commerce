import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroBanner, type HeroSlide } from "@/components/site/hero-banner";
import {
  BrandsStrip,
  CategoryShelf,
  DealCard,
  ProcessSection,
  ProductRailSection,
  Showcase,
  TelegramBand,
  VisitStore,
  WhySection,
  type Deal,
  type ShelfItem,
  type ShowcaseGroup,
} from "@/components/site/home-sections";
import { RecentlyViewed } from "@/components/site/recently-viewed";
import { discountPercent, displayPrice, priceCtx, type PriceCtx } from "@/lib/format";
import { getDict, href, plural, tl } from "@/lib/i18n";
import { activeVariants, colorOption, variantLabel } from "@/lib/product-utils";
import { listBanners } from "@/lib/repo/banners";
import { brandProductCounts, listBrands } from "@/lib/repo/brands";
import { buildTree, categoryStats, listCategories } from "@/lib/repo/categories";
import { getProductBySlug, queryProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";
import { alternates, categoryHref } from "@/lib/site-data";
import { isLocale, type Locale, type Product } from "@/lib/types";
import { toCard } from "@/lib/view";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = getSettings();
  return {
    title: { absolute: tl(settings.seo.title, locale) },
    alternates: alternates(locale, "/"),
    openGraph: { title: tl(settings.seo.title, locale), description: tl(settings.seo.description, locale) },
  };
}

/** The offer with the deepest discount, shown as "deal of the week". */
function buildDeal(p: Product, locale: Locale, ctx: PriceCtx): (Deal & { amount: number }) | null {
  const variants = activeVariants(p);
  const offers = variants.length
    ? variants.map((v) => ({ ...v, label: variantLabel(p.options, v, locale) }))
    : [{ id: "", values: {} as Record<string, string>, price: p.price, oldPrice: p.oldPrice, stock: p.stock, label: "" }];
  const best = offers
    .filter((o) => discountPercent(o.price, o.oldPrice) > 0)
    .sort(
      (a, b) =>
        Number(b.stock === "in_stock") - Number(a.stock === "in_stock") ||
        discountPercent(b.price, b.oldPrice) - discountPercent(a.price, a.oldPrice),
    )[0];
  if (!best || !best.oldPrice) return null;
  const card = toCard(p, locale, ctx);
  const color = colorOption(p.options);
  const colorValue = color?.values.find((v) => v.id === best.values[color.id]);
  const image = (colorValue && p.images.find((img) => img.color === colorValue.id)) || card.image;
  const price = displayPrice(best.price, ctx).main;
  const deal: Deal & { amount: number } = {
    amount: best.oldPrice - best.price,
    card: { ...card, image, tint: colorValue?.hex ?? card.tint, href: best.id ? `${card.href}?v=${best.id}` : card.href },
    pct: discountPercent(best.price, best.oldPrice),
    price,
    old: displayPrice(best.oldPrice, ctx).main,
    saving: displayPrice(best.oldPrice - best.price, ctx).main,
    variant: best.label || undefined,
    order: { id: p.id, name: card.name, variant: best.label || undefined, price, image, tint: colorValue?.hex ?? card.tint },
  };
  return deal;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = getSettings();
  const dict = getDict(locale);
  const ctx = priceCtx(settings, locale);
  const cards = (list: Product[]) => list.map((p) => toCard(p, locale, ctx));

  const categories = listCategories({ activeOnly: true });
  const stats = categoryStats(categories);

  // Each slide shows the live price of the product (or the size of the category) it links to.
  const slides: HeroSlide[] = listBanners({ activeOnly: true }).map((b) => {
    const productSlug = /^\/product\/([^/?#]+)/.exec(b.link)?.[1];
    const categorySlug = /^\/catalog\/([^/?#]+)/.exec(b.link)?.[1];
    const product = productSlug ? getProductBySlug(productSlug) : null;
    const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
    const count = category ? (stats.get(category.id)?.count ?? 0) : 0;
    const dark = b.theme === "dark";
    return {
      id: b.id,
      title: tl(b.title, locale),
      subtitle: tl(b.subtitle, locale),
      button: tl(b.button, locale),
      href: b.link.startsWith("/") ? href(locale, b.link) : b.link,
      image: b.image,
      imageMobile: b.imageMobile,
      bg: b.bg || (dark ? "#000000" : "#f5f5f7"),
      dark,
      price:
        product && product.minPrice > 0
          ? {
              main: displayPrice(product.minPrice, ctx).main,
              old: product.minOldPrice ? displayPrice(product.minOldPrice, ctx).main : undefined,
              from: product.maxPrice > product.minPrice,
            }
          : undefined,
      note: count > 0 ? plural(count, dict.catalog.count) : undefined,
    };
  });

  // Category shelf: big families (Apple) are shown by their subcategories, the rest as they are.
  const shelf: ShelfItem[] = buildTree(categories)
    .flatMap((root) => {
      const children = root.children.filter((c) => (stats.get(c.id)?.count ?? 0) > 0);
      return children.length >= 4 ? children : [root];
    })
    .filter((c) => (stats.get(c.id)?.count ?? 0) > 0)
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      name: tl(c.name, locale),
      href: categoryHref(locale, c),
      image: c.image,
      count: plural(stats.get(c.id)?.count ?? 0, dict.catalog.count),
    }));

  const sale = queryProducts({ onSale: true, sort: "discount", limit: 13 }).items;
  // Deal of the week: the biggest saving in money among products that are in stock.
  const deal =
    sale
      .filter((p) => p.inStock)
      .map((p) => buildDeal(p, locale, ctx))
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => b.amount - a.amount)[0] ?? null;
  // "New arrivals" is topped up with the latest other products so the row is never short.
  const fresh = queryProducts({ isNew: true, sort: "new", limit: 12 }).items;
  for (const p of queryProducts({ sort: "new", limit: 24 }).items) {
    if (fresh.length >= 12) break;
    if (!fresh.some((f) => f.id === p.id)) fresh.push(p);
  }
  const hits = queryProducts({ isHit: true, limit: 8 }).items;
  const featured = queryProducts({ isFeatured: true, limit: 8 }).items;
  const showcase: ShowcaseGroup[] = [
    { key: "hits", label: dict.home.hitsTitle, href: href(locale, "/catalog"), cards: cards(hits) },
    { key: "featured", label: dict.home.featuredTitle, href: href(locale, "/catalog"), cards: cards(featured) },
  ];

  const counts = brandProductCounts();
  const brands = listBrands()
    .filter((b) => (counts.get(b.id) ?? 0) > 0)
    .map((b) => ({ id: b.id, name: b.name, logo: b.logo, href: `${href(locale, "/catalog")}?brand=${b.id}` }));

  return (
    <div className="pb-4">
      <h1 className="sr-only">{tl(settings.seo.title, locale)}</h1>
      <HeroBanner
        slides={
          slides.length > 0
            ? slides
            : [
                {
                  id: 0,
                  title: tl(settings.tagline, locale),
                  subtitle: dict.home.processTitle,
                  button: dict.nav.catalog,
                  href: href(locale, "/catalog"),
                  image: null,
                  imageMobile: null,
                  bg: "#f5f5f7",
                  dark: false,
                },
              ]
        }
      />
      <CategoryShelf title={dict.home.categoriesTitle} lead={dict.home.categoriesLead} items={shelf} />
      <ProductRailSection
        title={dict.home.newTitle}
        lead={dict.home.newLead}
        link={{ href: `${href(locale, "/catalog")}?sort=new`, label: dict.common.viewAll }}
        cards={cards(fresh)}
      />
      {deal && <DealCard deal={deal} dict={dict} locale={locale} />}
      <ProductRailSection
        title={dict.home.saleTitle}
        lead={dict.home.saleSubtitle}
        link={{ href: href(locale, "/sale"), label: dict.common.viewAll }}
        cards={cards(sale.filter((p) => p.id !== deal?.order.id).slice(0, 12))}
      />
      <ProcessSection dict={dict} />
      <Showcase dict={dict} groups={showcase} />
      <WhySection dict={dict} />
      <BrandsStrip brands={brands} title={dict.home.brandsTitle} />
      <TelegramBand settings={settings} dict={dict} />
      <RecentlyViewed />
      <VisitStore settings={settings} locale={locale} dict={dict} />
    </div>
  );
}
