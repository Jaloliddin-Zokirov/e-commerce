"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Img } from "@/components/img";
import { href } from "@/lib/i18n";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSite } from "./site-context";

type Suggestion = {
  products: { id: number; href: string; name: string; price: string; old?: string; image: ImageAsset | null }[];
  categories: { href: string; name: string }[];
  total: number;
};

export function SearchBox({
  className,
  autoFocus = false,
  initial = "",
  onNavigate,
}: {
  className?: string;
  autoFocus?: boolean;
  initial?: string;
  onNavigate?: () => void;
}) {
  const { locale, dict } = useSite();
  const router = useRouter();
  const [query, setQuery] = useState(initial);
  const [data, setData] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const q = query.trim();
    // Short queries keep the old suggestions hidden (see showPanel) instead of fetching.
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`, {
          signal: controller.signal,
        });
        if (res.ok) setData(await res.json());
      } catch {
        // Aborted or offline: keep the previous suggestions.
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const products = data?.products ?? [];
  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setOpen(false);
    onNavigate?.();
    router.push(`${href(locale, "/search")}?q=${encodeURIComponent(trimmed)}`);
  };

  const showPanel = open && query.trim().length >= 2 && data !== null;

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && products[active]) {
            setOpen(false);
            onNavigate?.();
            router.push(products[active].href);
          } else submit(query);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, products.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, -1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={dict.search.placeholder}
          aria-label={dict.search.title}
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          enterKeyHint="search"
          className="h-11 w-full rounded-full bg-canvas pl-11 pr-11 text-[15px] text-ink outline-none ring-accent/25 transition placeholder:text-subtle focus:bg-white focus:ring-4 focus:shadow-[inset_0_0_0_1px_var(--color-accent)] [&::-webkit-search-cancel-button]:hidden"
        />
        {loading ? (
          <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-subtle" />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setData(null);
              }}
              aria-label={dict.common.close}
              className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-subtle hover:bg-line hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-auto rounded-[18px] bg-white p-2 shadow-pop ring-1 ring-black/5 animate-pop-in"
        >
          {products.length === 0 && data.categories.length === 0 ? (
            <div className="px-4 py-6 text-center text-[14px] text-muted">
              {dict.search.noResults.replace("{q}", query.trim())}
            </div>
          ) : (
            <>
              {data.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
                  {data.categories.map((c) => (
                    <Link key={c.href} href={c.href} onClick={() => { setOpen(false); onNavigate?.(); }} className="chip">
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
              {products.map((p, i) => (
                <Link
                  key={p.id}
                  href={p.href}
                  role="option"
                  aria-selected={i === active}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-2 transition hover:bg-canvas",
                    i === active && "bg-canvas",
                  )}
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">
                    {p.image && <Img asset={p.image} alt="" width={320} sizes="56px" className="size-full object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-ink">{p.name}</div>
                    <div className="mt-0.5 flex items-baseline gap-2 text-[13px] tabular">
                      <span className={cn("font-semibold", p.old ? "text-sale" : "text-ink")}>{p.price}</span>
                      {p.old && <span className="text-subtle line-through">{p.old}</span>}
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-subtle" />
                </Link>
              ))}
              {data.total > products.length && (
                <button
                  type="button"
                  onClick={() => submit(query)}
                  className="mt-1 w-full rounded-2xl px-3 py-3 text-center text-[14px] font-semibold text-accent hover:bg-accent-soft"
                >
                  {dict.search.allResults} ({data.total})
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
