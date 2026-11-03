"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal scroll-snap row with desktop arrow controls. */
export function Rail({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className={cn("group/rail relative", className)}>
      <div
        ref={ref}
        onScroll={update}
        aria-label={label}
        className="no-scrollbar scroll-room -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-4 lg:scroll-px-4 lg:gap-4 lg:px-4"
      >
        {children}
      </div>
      {!edges.start && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="←"
          className="absolute -left-5 top-[38%] z-10 hidden size-11 place-items-center rounded-full bg-white shadow-pop ring-1 ring-black/5 transition hover:scale-105 lg:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="→"
          className="absolute -right-5 top-[38%] z-10 hidden size-11 place-items-center rounded-full bg-white shadow-pop ring-1 ring-black/5 transition hover:scale-105 lg:grid"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
}

export function RailItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] xl:w-[19%]", className)}>{children}</div>
  );
}
