"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Img } from "@/components/img";
import { href } from "@/lib/i18n";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Money } from "./money";
import { useSite } from "./site-context";

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  button: string;
  href: string;
  image: ImageAsset | null;
  imageMobile: ImageAsset | null;
  /** Banner background; `dark` switches the text to white. */
  bg: string;
  dark: boolean;
  /** Live price of the linked product. */
  price?: { main: string; old?: string; from?: boolean };
  /** Size of the linked category ("12 ta mahsulot"). */
  note?: string;
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const m = window.matchMedia(reducedMotionQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/** Rounded banner carousel: text on the left, product on the right; switches every `interval` ms until paused. */
export function HeroBanner({ slides, interval = 3000 }: { slides: HeroSlide[]; interval?: number }) {
  const { dict, locale } = useSite();
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const go = useCallback((i: number) => setIndex(((i % slides.length) + slides.length) % slides.length), [slides.length]);
  const active = slides[index] ?? slides[0];
  const playing = slides.length > 1 && !stopped && !reduced;
  const dark = active.dark;

  // Any slide change (autoplay, dots, arrows, swipe) starts a fresh countdown.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => go(index + 1), interval);
    return () => clearTimeout(timer);
  }, [playing, index, interval, go]);

  return (
    <section className="container-page pt-3 sm:pt-5" aria-roledescription="carousel" aria-label={active.title}>
      <div
        className="group relative overflow-hidden rounded-[22px] transition-colors duration-700 sm:rounded-[28px]"
        style={{ backgroundColor: active.bg }}
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
          setTouchX(null);
        }}
      >
        {/* All slides share one grid cell and cross-fade. */}
        <div className="grid">
          {slides.map((s, i) => {
            const current = i === index;
            return (
              <div
                key={s.id}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${slides.length}`}
                aria-hidden={!current}
                className={cn(
                  "col-start-1 row-start-1 grid items-center pb-16 transition-opacity duration-700 ease-out md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:pb-0",
                  current ? "opacity-100" : "pointer-events-none opacity-0",
                  s.dark ? "text-white" : "text-ink",
                )}
              >
                <div className="relative z-10 px-6 pt-10 text-center sm:px-12 sm:pt-12 md:py-20 md:pl-12 md:pr-2 md:text-left lg:pl-16 xl:pl-20">
                  <h2 className="text-balance text-[32px] font-semibold leading-[1.06] tracking-[-0.028em] sm:text-[44px] lg:text-[54px]">
                    {s.title}
                  </h2>
                  {s.subtitle && (
                    <p
                      className={cn(
                        "mx-auto mt-3 max-w-md text-balance text-[17px] leading-snug sm:text-[19px] md:mx-0 lg:text-[21px]",
                        s.dark ? "text-white/70" : "text-ink-2",
                      )}
                    >
                      {s.subtitle}
                    </p>
                  )}
                  {s.price ? (
                    <p className="mt-4 flex flex-wrap items-baseline justify-center gap-x-2.5 md:justify-start">
                      <Money
                        value={s.price.main}
                        locale={locale}
                        from={s.price.from}
                        className="text-[17px] font-semibold sm:text-[19px]"
                        unitClassName="text-[14px] font-medium sm:text-[15px]"
                      />
                      {s.price.old && (
                        <span className={cn("text-[15px] line-through tabular", s.dark ? "text-white/45" : "text-subtle")}>{s.price.old}</span>
                      )}
                    </p>
                  ) : (
                    s.note && <p className={cn("mt-4 text-[15px] font-medium", s.dark ? "text-white/60" : "text-muted")}>{s.note}</p>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                    {s.href && (
                      <Link
                        href={s.href}
                        tabIndex={current ? undefined : -1}
                        className={cn("btn", s.dark ? "bg-white text-ink hover:bg-white/90" : "btn-primary")}
                      >
                        {s.button || dict.common.more}
                      </Link>
                    )}
                    <Link
                      href={href(locale, "/catalog")}
                      tabIndex={current ? undefined : -1}
                      className={cn("btn", s.dark ? "text-white ring-1 ring-inset ring-white/40 hover:bg-white/10" : "btn-outline")}
                    >
                      {dict.nav.catalog}
                    </Link>
                  </div>
                </div>
                <div className="relative mx-auto mt-6 h-[240px] w-full max-w-[520px] sm:h-[320px] md:mt-0 md:h-[420px] md:max-w-none lg:h-[480px]">
                  {s.image && (
                    <Img
                      asset={s.image}
                      alt={s.title}
                      priority={i === 0}
                      width={1080}
                      sizes="(min-width: 768px) 55vw, 100vw"
                      className={cn(
                        "absolute inset-0 size-full object-contain px-4 transition-transform duration-[1200ms] ease-out md:p-6",
                        s.imageMobile && "hidden md:block",
                        current ? "scale-100" : "scale-[0.97]",
                      )}
                    />
                  )}
                  {s.imageMobile && (
                    <Img
                      asset={s.imageMobile}
                      alt={s.title}
                      priority={i === 0}
                      width={640}
                      sizes="100vw"
                      className="absolute inset-0 size-full object-contain px-4 md:hidden"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <>
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => go(index + dir)}
                aria-label={dir < 0 ? dict.common.prev : dict.common.next}
                className={cn(
                  "absolute top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full opacity-0 backdrop-blur-md transition group-hover:opacity-100 focus-visible:opacity-100 md:grid",
                  dir < 0 ? "left-4" : "right-4",
                  dark ? "bg-white/15 text-white hover:bg-white/25" : "bg-white/80 text-ink shadow-[0_2px_10px_rgb(0_0_0/0.1)] hover:bg-white",
                )}
              >
                {dir < 0 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
              </button>
            ))}
            <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2 sm:bottom-5">
              <div className={cn("flex h-9 items-center gap-2 rounded-full px-3.5 backdrop-blur-md", dark ? "bg-white/15" : "bg-black/[0.06]")}>
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={s.title || `${i + 1}`}
                    aria-current={i === index}
                    className={cn(
                      "relative h-2 overflow-hidden rounded-full transition-all duration-500",
                      i === index ? "w-8" : "w-2",
                      dark ? "bg-white/35 hover:bg-white/60" : "bg-black/20 hover:bg-black/40",
                    )}
                  >
                    {i === index && (
                      <span
                        // Fills up over the slide's time; restarts for every slide.
                        key={`p-${index}-${playing}`}
                        className={cn("absolute inset-0 origin-left rounded-full", dark ? "bg-white" : "bg-ink", playing && "animate-hero-progress")}
                        style={playing ? { animationDuration: `${interval}ms` } : undefined}
                      />
                    )}
                  </button>
                ))}
              </div>
              {!reduced && (
                <button
                  type="button"
                  onClick={() => setStopped((v) => !v)}
                  aria-label={stopped ? dict.common.play : dict.common.pause}
                  className={cn(
                    "grid size-9 place-items-center rounded-full backdrop-blur-md transition",
                    dark ? "bg-white/15 text-white hover:bg-white/25" : "bg-black/[0.06] text-ink hover:bg-black/10",
                  )}
                >
                  {stopped ? <Play className="size-3.5" fill="currentColor" /> : <Pause className="size-3.5" fill="currentColor" />}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
