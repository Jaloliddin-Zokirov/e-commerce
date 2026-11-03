"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Overlay } from "./overlay";
import { useSite } from "./site-context";

export type FilterFacets = {
  brands: { id: number; name: string; count: number }[];
  conditions: { value: string; label: string; count: number }[];
  price: { min: number; max: number; unit: string };
  showSale: boolean;
};

export type FilterState = {
  brand: number[];
  min?: number;
  max?: number;
  stock: boolean;
  sale: boolean;
  cond: string[];
  sort: string;
};

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(search.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      const qs = params.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [router, pathname, search],
  );
  return { update, pending };
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-[14px] transition hover:bg-canvas">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-[18px] shrink-0 cursor-pointer rounded-[5px] accent-[#1d1d1f]"
      />
      <span className="flex flex-1 items-center justify-between gap-2">{children}</span>
    </label>
  );
}

function FilterBody({ facets, state, onDone }: { facets: FilterFacets; state: FilterState; onDone?: () => void }) {
  const { dict } = useSite();
  const { update, pending } = useFilterNav();
  const [min, setMin] = useState(state.min?.toString() ?? "");
  const [max, setMax] = useState(state.max?.toString() ?? "");

  const toggleList = (key: "brand" | "cond", list: (string | number)[], value: string | number, on: boolean) => {
    const next = on ? [...list, value] : list.filter((x) => x !== value);
    update({ [key]: next.length ? next.join(",") : null });
  };
  const applyPrice = () => {
    const clean = (v: string) => v.replace(/\D/g, "");
    update({ min: clean(min) || null, max: clean(max) || null });
  };
  const hasAny = state.brand.length > 0 || state.min || state.max || state.stock || state.sale || state.cond.length > 0;

  return (
    <div className={cn("space-y-6", pending && "opacity-70")}>
      {facets.brands.length > 0 && (
        <fieldset>
          <legend className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{dict.catalog.brand}</legend>
          {facets.brands.map((b) => (
            <Check key={b.id} checked={state.brand.includes(b.id)} onChange={(on) => toggleList("brand", state.brand, b.id, on)}>
              <span>{b.name}</span>
              <span className="text-[12px] text-subtle tabular">{b.count}</span>
            </Check>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
          {dict.catalog.price}, {facets.price.unit}
        </legend>
        <form
          className="grid grid-cols-2 gap-2 px-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
        >
          <input
            className="field tabular"
            inputMode="numeric"
            placeholder={`${dict.catalog.priceMin} ${facets.price.min ? formatNumber(facets.price.min) : ""}`.trim()}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={applyPrice}
            aria-label={`${dict.catalog.price} ${dict.catalog.priceMin}`}
          />
          <input
            className="field tabular"
            inputMode="numeric"
            placeholder={`${dict.catalog.priceMax} ${facets.price.max ? formatNumber(facets.price.max) : ""}`.trim()}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={applyPrice}
            aria-label={`${dict.catalog.price} ${dict.catalog.priceMax}`}
          />
          <button type="submit" className="sr-only">
            {dict.catalog.apply}
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{dict.catalog.availability}</legend>
        <Check checked={state.stock} onChange={(on) => update({ stock: on ? "1" : null })}>
          {dict.catalog.inStockOnly}
        </Check>
        {facets.showSale && (
          <Check checked={state.sale} onChange={(on) => update({ sale: on ? "1" : null })}>
            {dict.catalog.onSaleOnly}
          </Check>
        )}
      </fieldset>

      {facets.conditions.length > 1 && (
        <fieldset>
          <legend className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{dict.catalog.condition}</legend>
          {facets.conditions.map((c) => (
            <Check key={c.value} checked={state.cond.includes(c.value)} onChange={(on) => toggleList("cond", state.cond, c.value, on)}>
              <span>{c.label}</span>
              <span className="text-[12px] text-subtle tabular">{c.count}</span>
            </Check>
          ))}
        </fieldset>
      )}

      <div className="flex gap-2 px-2">
        {hasAny && (
          <button
            type="button"
            className="btn btn-soft btn-sm flex-1"
            onClick={() => update({ brand: null, min: null, max: null, stock: null, sale: null, cond: null })}
          >
            {dict.catalog.reset}
          </button>
        )}
        {onDone && (
          <button type="button" className="btn btn-primary btn-sm flex-1" onClick={onDone}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : dict.catalog.apply}
          </button>
        )}
      </div>
    </div>
  );
}

/** Remount when the URL price range changes so the inputs pick up the new values. */
const priceKey = (state: FilterState) => `${state.min ?? ""}-${state.max ?? ""}`;

export function CatalogFilters({ facets, state }: { facets: FilterFacets; state: FilterState }) {
  return <FilterBody key={priceKey(state)} facets={facets} state={state} />;
}

export function MobileFilters({ facets, state, activeCount }: { facets: FilterFacets; state: FilterState; activeCount: number }) {
  const { dict } = useSite();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm lg:hidden">
        <SlidersHorizontal className="size-4" />
        {dict.catalog.filters}
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-ink text-[11px] text-white tabular">{activeCount}</span>
        )}
      </button>
      <Overlay open={open} onClose={close} side="bottom" label={dict.catalog.filters}>
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-[20px] font-semibold">{dict.catalog.filters}</h2>
          <button type="button" onClick={close} aria-label={dict.common.close} className="grid size-9 place-items-center rounded-full bg-canvas">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-3 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2">
          <FilterBody key={priceKey(state)} facets={facets} state={state} onDone={close} />
        </div>
      </Overlay>
    </>
  );
}

export function SortSelect({ value }: { value: string }) {
  const { dict } = useSite();
  const { update, pending } = useFilterNav();
  const sorts = dict.catalog.sorts;
  return (
    <label className="relative flex min-w-0 items-center gap-2 text-[14px]">
      <span className="hidden text-muted sm:inline">{dict.catalog.sort}:</span>
      <select
        value={value}
        onChange={(e) => update({ sort: e.target.value })}
        className="field h-9 min-h-0 w-auto min-w-0 max-w-full truncate rounded-full py-0 pl-3.5 text-[14px] font-medium"
        aria-label={dict.catalog.sort}
      >
        {(Object.keys(sorts) as (keyof typeof sorts)[]).map((key) => (
          <option key={key} value={key}>
            {sorts[key]}
          </option>
        ))}
      </select>
      {pending && <LoaderCircle className="size-4 animate-spin text-subtle" />}
    </label>
  );
}
