"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSite } from "./site-context";

const tashkentClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tashkent",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function minutesNow(date: Date): number {
  const [h, m] = tashkentClock.format(date).split(":").map(Number);
  return h * 60 + m;
}

/**
 * "Hozir ochiq · 21:00 gacha" badge parsed from the free-text work hours ("Har kuni 10:00 – 21:00").
 * Renders nothing when the hours cannot be read.
 */
export function OpenStatus({ hours, className, tone = "light" }: { hours: string; className?: string; tone?: "light" | "dark" }) {
  const { dict } = useSite();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  // TODO(work-hours): days of the week are not parsed yet — the shop is treated as open daily.
  const match = /(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/.exec(hours);
  if (!match || !now) return null;
  const [, oh, om, ch, cm] = match;
  const open = Number(oh) * 60 + Number(om);
  const close = Number(ch) * 60 + Number(cm);
  const current = minutesNow(now);
  const isOpen = close > open ? current >= open && current < close : current >= open || current < close;
  const pad = (h: string, m: string) => `${h.padStart(2, "0")}:${m}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold animate-fade-in",
        tone === "dark" ? "bg-white/10 text-white" : isOpen ? "bg-ok-soft text-ok" : "bg-canvas text-muted",
        className,
      )}
    >
      <span className="relative flex size-2">
        {isOpen && <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />}
        <span className={cn("relative inline-flex size-2 rounded-full", isOpen ? "bg-ok" : "bg-subtle")} />
      </span>
      {isOpen ? dict.home.openNow : dict.home.closedNow}
      <span className={cn("font-medium", tone === "dark" ? "text-white/60" : "opacity-70")}>
        · {isOpen ? fmt(dict.home.openUntil, { time: pad(ch, cm) }) : fmt(dict.home.opensAt, { time: pad(oh, om) })}
      </span>
    </span>
  );
}
