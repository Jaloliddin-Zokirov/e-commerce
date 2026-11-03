import { getDict, href, tl } from "./i18n";
import { displayPrice, type PriceCtx } from "./format";
import { bestStock, colorOption, offers } from "./product-utils";
import type { ImageAsset, Locale, Product, StockStatus } from "./types";

export type BadgeTone = "sale" | "new" | "hit" | "refurb";
export type StockTone = "ok" | "warn" | "muted";

export type CardData = {
  id: number;
  locale: Locale;
  href: string;
  name: string;
  tagline: string;
  image: ImageAsset | null;
  /** Main color of the product, used to tint the image backdrop. */
  tint: string | null;
  badges: { label: string; tone: BadgeTone }[];
  price: {
    main: string;
    alt?: string;
    old?: string;
    /** Variants have different prices: show "from". */
    from: boolean;
    onRequest: boolean;
  };
  stock: { status: StockStatus; label: string; tone: StockTone };
  colors: { hex: string; label: string }[];
};

export const STOCK_TONE: Record<StockStatus, StockTone> = {
  in_stock: "ok",
  preorder: "warn",
  soon: "warn",
  out_of_stock: "muted",
};

/** Serializable card model used by server pages and the client-side lists alike. */
export function toCard(p: Product, locale: Locale, ctx: PriceCtx): CardData {
  const dict = getDict(locale);
  const colorOpt = colorOption(p.options);
  const firstColor = colorOpt?.values[0];
  const image = (firstColor && p.images.find((img) => img.color === firstColor.id)) || p.images[0] || null;

  const badges: CardData["badges"] = [];
  if (p.discountPct > 0) badges.push({ label: `−${p.discountPct}%`, tone: "sale" });
  if (p.isNew) badges.push({ label: dict.badge.new, tone: "new" });
  if (p.isHit) badges.push({ label: dict.badge.hit, tone: "hit" });
  if (p.condition === "refurbished") badges.push({ label: dict.badge.refurbished, tone: "refurb" });

  const onRequest = p.minPrice <= 0;
  const shown = displayPrice(p.minPrice, ctx);
  const status = bestStock(offers(p));

  return {
    id: p.id,
    locale,
    href: href(locale, `/product/${p.slug}`),
    name: tl(p.name, locale),
    tagline: tl(p.tagline, locale),
    image,
    tint: firstColor?.hex ?? null,
    badges,
    price: {
      onRequest,
      from: !onRequest && p.maxPrice > p.minPrice,
      main: onRequest ? dict.price.onRequest : shown.main,
      alt: onRequest ? undefined : shown.alt,
      old: !onRequest && p.minOldPrice ? displayPrice(p.minOldPrice, ctx).main : undefined,
    },
    stock: { status, label: dict.stock[status], tone: STOCK_TONE[status] },
    colors: (colorOpt?.values ?? [])
      .filter((v) => v.hex)
      .map((v) => ({ hex: v.hex!, label: tl(v.label, locale) })),
  };
}
