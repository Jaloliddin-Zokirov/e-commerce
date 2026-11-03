import type {
  Locale,
  Product,
  ProductOption,
  ProductVariant,
  StockStatus,
} from "./types";
import { discountPercent } from "./format";
import { tl } from "./i18n";

export type PricedOffer = { price: number; oldPrice: number | null; stock: StockStatus };

/** Variants that are switched on; a product without options has none. */
export function activeVariants(p: Pick<Product, "options" | "variants">): ProductVariant[] {
  if (p.options.length === 0) return [];
  return p.variants.filter((v) => v.enabled);
}

/** Every purchasable offer of a product (variants, or the base price). */
export function offers(
  p: Pick<Product, "options" | "variants" | "price" | "oldPrice" | "stock">,
): PricedOffer[] {
  const vs = activeVariants(p);
  if (vs.length > 0) return vs;
  return [{ price: p.price, oldPrice: p.oldPrice, stock: p.stock }];
}

const STOCK_RANK: Record<StockStatus, number> = {
  in_stock: 0,
  preorder: 1,
  soon: 2,
  out_of_stock: 3,
};

export function bestStock(list: PricedOffer[]): StockStatus {
  return list.reduce<StockStatus>(
    (best, o) => (STOCK_RANK[o.stock] < STOCK_RANK[best] ? o.stock : best),
    "out_of_stock",
  );
}

export type Derived = {
  minPrice: number;
  maxPrice: number;
  minOldPrice: number | null;
  discountPct: number;
  inStock: boolean;
};

/** Denormalized columns used for listing, sorting and filtering. */
export function deriveProduct(
  p: Pick<Product, "options" | "variants" | "price" | "oldPrice" | "stock">,
): Derived {
  const list = offers(p);
  const priced = list.filter((o) => o.price > 0);
  const available = priced.filter((o) => o.stock !== "out_of_stock");
  // Show the cheapest available offer; fall back to any priced offer.
  const pool = available.length ? available : priced;
  const cheapest = pool.reduce<PricedOffer | null>(
    (min, o) => (!min || o.price < min.price ? o : min),
    null,
  );
  return {
    minPrice: cheapest?.price ?? 0,
    maxPrice: priced.reduce((max, o) => Math.max(max, o.price), 0),
    minOldPrice:
      cheapest && cheapest.oldPrice && cheapest.oldPrice > cheapest.price ? cheapest.oldPrice : null,
    discountPct: list.reduce((max, o) => Math.max(max, discountPercent(o.price, o.oldPrice)), 0),
    inStock: list.some((o) => o.stock === "in_stock"),
  };
}

/** Cartesian product of option values, reusing data from existing variants. */
export function buildVariants(
  options: ProductOption[],
  existing: ProductVariant[],
  defaults: { price: number; oldPrice: number | null; stock: StockStatus },
  makeId: () => string,
): ProductVariant[] {
  const usable = options.filter((o) => o.values.length > 0);
  if (usable.length === 0) return [];
  let combos: Record<string, string>[] = [{}];
  for (const opt of usable) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const val of opt.values) next.push({ ...combo, [opt.id]: val.id });
    }
    combos = next;
  }
  const keyOf = (values: Record<string, string>) =>
    usable.map((o) => `${o.id}:${values[o.id] ?? ""}`).join("|");
  const byKey = new Map(existing.map((v) => [keyOf(v.values), v]));
  return combos.map((values) => {
    const prev = byKey.get(keyOf(values));
    if (prev) return { ...prev, values };
    return { id: makeId(), values, enabled: true, ...defaults };
  });
}

/** "Cosmic Orange · 256 GB" */
export function variantLabel(
  options: ProductOption[],
  variant: Pick<ProductVariant, "values">,
  locale: Locale,
): string {
  return options
    .map((opt) => {
      const val = opt.values.find((v) => v.id === variant.values[opt.id]);
      return val ? tl(val.label, locale) : "";
    })
    .filter(Boolean)
    .join(" · ");
}

export function colorOption(options: ProductOption[]): ProductOption | undefined {
  return options.find((o) => o.kind === "color");
}

export function displayName(p: Pick<Product, "name">, locale: Locale): string {
  return tl(p.name, locale);
}
