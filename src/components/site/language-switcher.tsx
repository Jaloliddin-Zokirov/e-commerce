"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOCALES } from "@/lib/types";
import { useSite } from "./site-context";

export function useLocaleHref() {
  const pathname = usePathname();
  const search = useSearchParams();
  return (target: string) => {
    const rest = pathname.replace(/^\/(uz|ru)(?=\/|$)/, "");
    const query = search.toString();
    return `/${target}${rest}${query ? `?${query}` : ""}`;
  };
}

export function LanguageSwitcher({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { locale } = useSite();
  const toHref = useLocaleHref();
  return (
    <div
      className={cn(
        "inline-flex rounded-full p-0.5 text-[13px] font-semibold",
        tone === "light" ? "bg-canvas" : "bg-white/10",
        className,
      )}
      role="group"
      aria-label="Til / Язык"
    >
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={toHref(l)}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition",
            l === locale
              ? tone === "light"
                ? "bg-white text-ink shadow-[0_1px_3px_rgb(0_0_0/0.1)]"
                : "bg-white text-ink"
              : tone === "light"
                ? "text-muted hover:text-ink"
                : "text-white/70 hover:text-white",
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
