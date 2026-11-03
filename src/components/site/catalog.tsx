import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, X } from "lucide-react";
import type { ReactNode } from "react";
import { TelegramIcon } from "@/components/brand-icons";
import { convert, formatMoney, priceCtx, type PriceCtx } from "@/lib/format";
import { getDict, plural } from "@/lib/i18n";
import { telegramChatUrl } from "@/lib/links";
import {
  brandFacets,
  conditionFacets,
  priceBounds,
  queryProducts,
  SORT_KEYS,
  type ProductQuery,
  type SortKey,
} from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";
import { CONDITIONS, type Condition, type Currency, type Locale } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toCard } from "@/lib/view";
import { CatalogFilters, MobileFilters, SortSelect, type FilterState } from "./catalog-controls";
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./section";

export type RawSearch = Record<string, string | string[] | undefined>;

const PER_PAGE = 24;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function intList(value: string | undefined): number[] {
  return (value ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

function positive(value: string | undefined): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Currency the shopper types filter prices in. */
function filterCurrency(ctx: PriceCtx): Currency {
  return ctx.display === "USD" ? "USD" : "UZS";
}

function toBase(amount: number, ctx: PriceCtx): number {
  const from = filterCurrency(ctx);
  if (from === ctx.base) return amount;
  const rate = ctx.rate > 0 ? ctx.rate : 1;
  return from === "UZS" ? amount / rate : amount * rate;
}

export function parseFilters(search: RawSearch): FilterState & { page: number; q?: string } {
  const sort = one(search.sort);
  return {
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "popular",
    brand: intList(one(search.brand)),
    min: positive(one(search.min)),
    max: positive(one(search.max)),
    stock: one(search.stock) === "1",
    sale: one(search.sale) === "1",
    cond: (one(search.cond) ?? "").split(",").filter((c): c is Condition => CONDITIONS.includes(c as Condition)),
    page: Math.max(1, Math.floor(Number(one(search.page)) || 1)),
    q: one(search.q)?.trim().slice(0, 80) || undefined,
  };
}

function buildHref(basePath: string, search: RawSearch, patch: Record<string, string | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    const v = one(value);
    if (v) params.set(key, v);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function CatalogView({
  locale,
  search,
  basePath,
  title,
  crumbs,
  scope,
  header,
  subtitle,
  showSaleFilter = true,
}: {
  locale: Locale;
  search: RawSearch;
  basePath: string;
  title: ReactNode;
  crumbs: { href?: string; label: string }[];
  /** Fixed constraints of this listing (category, sale, search). */
  scope: ProductQuery;
  header?: ReactNode;
  subtitle?: string;
  showSaleFilter?: boolean;
}) {
  const settings = getSettings();
  const dict = getDict(locale);
  const ctx = priceCtx(settings, locale);
  const f = parseFilters(search);
  const currency = filterCurrency(ctx);

  const scoped: ProductQuery = { ...scope, q: scope.q ?? f.q };
  const query: ProductQuery = {
    ...scoped,
    brandIds: f.brand.length ? f.brand : undefined,
    minPrice: f.min !== undefined ? toBase(f.min, ctx) : undefined,
    maxPrice: f.max !== undefined ? toBase(f.max, ctx) : undefined,
    inStock: f.stock || undefined,
    onSale: scope.onSale || f.sale || undefined,
    conditions: f.cond.length ? (f.cond as Condition[]) : undefined,
    sort: f.sort as SortKey,
    limit: PER_PAGE,
    offset: (f.page - 1) * PER_PAGE,
  };
  const { items, total } = queryProducts(query);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const bounds = priceBounds(query);
  const facets = {
    brands: brandFacets(query),
    conditions: conditionFacets(query).map((c) => ({
      value: c.condition,
      label: dict.condition[c.condition],
      count: c.count,
    })),
    price: {
      min: bounds.min ? Math.floor(convert(bounds.min, currency, ctx)) : 0,
      max: bounds.max ? Math.ceil(convert(bounds.max, currency, ctx)) : 0,
      unit: currency === "UZS" ? (locale === "ru" ? "сум" : "soʻm") : "$",
    },
    showSale: showSaleFilter && !scope.onSale,
  };
  const cards = items.map((p) => toCard(p, locale, ctx));

  const chips: { label: string; href: string }[] = [];
  for (const id of f.brand) {
    const name = facets.brands.find((b) => b.id === id)?.name;
    if (name) {
      const rest = f.brand.filter((b) => b !== id);
      chips.push({ label: name, href: buildHref(basePath, search, { brand: rest.length ? rest.join(",") : null, page: null }) });
    }
  }
  if (f.min || f.max) {
    const label = [
      f.min ? `${dict.catalog.priceMin} ${formatMoney(f.min, currency, locale)}` : "",
      f.max ? `${dict.catalog.priceMax} ${formatMoney(f.max, currency, locale)}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    chips.push({ label, href: buildHref(basePath, search, { min: null, max: null, page: null }) });
  }
  if (f.stock) chips.push({ label: dict.catalog.inStockOnly, href: buildHref(basePath, search, { stock: null, page: null }) });
  if (f.sale && !scope.onSale)
    chips.push({ label: dict.catalog.onSaleOnly, href: buildHref(basePath, search, { sale: null, page: null }) });
  for (const c of f.cond) {
    const rest = f.cond.filter((x) => x !== c);
    chips.push({
      label: dict.condition[c as Condition],
      href: buildHref(basePath, search, { cond: rest.length ? rest.join(",") : null, page: null }),
    });
  }

  const pageHref = (p: number) => buildHref(basePath, search, { page: p > 1 ? String(p) : null });
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - f.page) <= 1,
  );

  return (
    <div className="container-page pt-4 lg:pt-6">
      <Breadcrumbs items={crumbs} />
      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.028em] sm:text-[40px] lg:text-[48px]">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">{subtitle}</p>}
        </div>
        <p className="shrink-0 pb-1 text-[15px] text-muted tabular">{plural(total, dict.catalog.count)}</p>
      </div>
      {header}

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:mt-8">
        <aside className="hidden lg:block">
          <div className="sticky top-[132px] rounded-[18px] bg-white p-3 shadow-tile">
            <CatalogFilters facets={facets} state={f} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
            <MobileFilters facets={facets} state={f} activeCount={chips.length} />
            <div className="ml-auto flex min-w-0 justify-end">
              <SortSelect value={f.sort} />
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Link key={chip.label} href={chip.href} scroll={false} className="chip gap-1.5 pr-2.5" data-active="true">
                  {chip.label}
                  <X className="size-3.5 opacity-70" />
                </Link>
              ))}
            </div>
          )}

          {cards.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {cards.map((card, i) => (
                <ProductCard key={card.id} card={card} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-[18px] bg-white px-6 py-16 text-center shadow-tile">
              <PackageSearch className="size-12 text-line-2" strokeWidth={1.5} />
              <h2 className="mt-4 text-[20px] font-semibold">{dict.catalog.empty}</h2>
              <p className="mt-2 max-w-md text-[15px] text-muted">{dict.catalog.emptyHint}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {chips.length > 0 && (
                  <Link href={basePath + (f.q ? `?q=${encodeURIComponent(f.q)}` : "")} className="btn btn-outline">
                    {dict.catalog.reset}
                  </Link>
                )}
                {settings.telegramUser && (
                  <a href={telegramChatUrl(settings.telegramUser)} target="_blank" rel="noopener" className="btn btn-telegram">
                    <TelegramIcon className="size-[18px]" /> {dict.common.writeTelegram}
                  </a>
                )}
              </div>
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label={dict.catalog.title}>
              {f.page > 1 && (
                <Link href={pageHref(f.page - 1)} className="grid size-10 place-items-center rounded-full bg-white hover:bg-line" aria-label={dict.common.prev}>
                  <ChevronLeft className="size-5" />
                </Link>
              )}
              {pageNumbers.map((p, i) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
                  <Link
                    href={pageHref(p)}
                    aria-current={p === f.page ? "page" : undefined}
                    className={cn(
                      "grid h-10 min-w-10 place-items-center rounded-full px-3 text-[15px] font-medium tabular transition",
                      p === f.page ? "bg-ink text-white" : "bg-white hover:bg-line",
                    )}
                  >
                    {p}
                  </Link>
                </span>
              ))}
              {f.page < pages && (
                <Link href={pageHref(f.page + 1)} className="grid size-10 place-items-center rounded-full bg-white hover:bg-line" aria-label={dict.common.next}>
                  <ChevronRight className="size-5" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export function SubcategoryChips({
  items,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
}) {
  if (items.length <= 1) return null;
  return (
    <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="chip" data-active={item.active}>
          {item.label}
          {item.count !== undefined && <span className="text-[12px] opacity-60 tabular">{item.count}</span>}
        </Link>
      ))}
    </div>
  );
}
