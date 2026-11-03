"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ShowcaseTab = { key: string; label: string; href: string };

/** Segmented tabs over product grids rendered on the server. */
export function ShowcaseTabs({
  tabs,
  panels,
  label,
  allLabel,
}: {
  tabs: ShowcaseTab[];
  panels: ReactNode[];
  label: string;
  allLabel: string;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + tabs.length) % tabs.length;
    setActive(next);
    buttons.current[next]?.focus();
  };

  const current = tabs[active];
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div className="no-scrollbar -mx-4 min-w-0 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex w-max gap-0.5 rounded-full bg-[#e8e8ed] p-[3px]">
            {tabs.map((tab, i) => (
              <button
                key={tab.key}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={i === active}
                aria-controls={`${id}-panel-${i}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-[14px] font-medium tracking-[-0.01em] transition duration-200 sm:h-10 sm:px-5 sm:text-[15px]",
                  i === active ? "bg-white text-ink shadow-[0_1px_4px_rgb(0_0_0/0.12)]" : "text-ink-2 hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <Link
          href={current.href}
          className="group hidden shrink-0 items-center text-[15px] font-medium text-accent hover:underline sm:inline-flex"
        >
          {allLabel}
          <ChevronRight className="size-4 transition group-hover:translate-x-0.5" strokeWidth={2.2} />
        </Link>
      </div>
      {panels.map((panel, i) => (
        <div
          key={tabs[i].key}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          className="animate-pop-in"
        >
          {panel}
        </div>
      ))}
      <Link href={current.href} className="btn btn-outline mt-6 w-full sm:hidden">
        {allLabel}
        <ArrowRight className="size-4" />
      </Link>
    </>
  );
}
