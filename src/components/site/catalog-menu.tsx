"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Img } from "@/components/img";
import { href } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "./menu-types";
import { useSite } from "./site-context";

export function CatalogMenu({ tree }: { tree: MenuCategory[] }) {
  const { dict, locale } = useSite();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(tree[0]?.id ?? 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const active = tree.find((c) => c.id === current) ?? tree[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn btn-primary btn-sm h-10 gap-2 px-4"
      >
        {open ? <X className="size-[18px]" /> : <LayoutGrid className="size-[18px]" />}
        {dict.nav.catalog}
      </button>

      {open && active && (
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="absolute left-0 top-[calc(100%+14px)] z-50 flex w-[min(920px,calc(100vw-64px))] overflow-hidden rounded-[18px] bg-white shadow-pop ring-1 ring-black/5 animate-pop-in"
        >
          <ul className="w-64 shrink-0 border-r border-line bg-[#fbfbfd] p-2">
            {tree.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.href}
                  onMouseEnter={() => setCurrent(c.id)}
                  onFocus={() => setCurrent(c.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
                    c.id === active.id ? "bg-white text-ink shadow-[0_1px_3px_rgb(0_0_0/0.07)]" : "text-ink-2 hover:bg-white",
                  )}
                >
                  <span className="size-9 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                    {c.image && <Img asset={c.image} alt="" width={320} sizes="36px" className="size-full object-contain p-0.5" />}
                  </span>
                  <span className="flex-1">{c.name}</span>
                  <ChevronRight className="size-4 text-subtle" />
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <Link
                href={href(locale, "/sale")}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-sale hover:bg-white"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-sale-soft text-[13px] font-bold">%</span>
                {dict.nav.sale}
              </Link>
            </li>
          </ul>
          <div className="min-h-[360px] flex-1 p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[22px] font-semibold tracking-[-0.02em]">{active.name}</h3>
              <Link href={active.href} className="text-[14px] font-medium text-accent hover:underline">
                {dict.common.viewAll} →
              </Link>
            </div>
            {active.children.length > 0 ? (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {active.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href}
                    className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-canvas"
                  >
                    <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-canvas">
                      {child.image && (
                        <Img
                          asset={child.image}
                          alt=""
                          width={320}
                          sizes="56px"
                          className="size-full object-contain p-1 transition group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="text-[15px] font-medium text-ink">{child.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href={active.href} className="mt-5 block overflow-hidden rounded-2xl bg-canvas p-6">
                {active.image && (
                  <Img asset={active.image} alt={active.name} width={640} sizes="300px" className="mx-auto h-48 w-auto object-contain" />
                )}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
