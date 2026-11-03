import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small uppercase label above a heading ("YANGI", "HAFTA TAKLIFI"). */
export function Eyebrow({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "sale" | "light" | "muted"; className?: string }) {
  const tones = {
    brand: "text-new",
    sale: "text-sale",
    light: "text-white/70",
    muted: "text-muted",
  };
  return <p className={cn("text-[12px] font-semibold uppercase tracking-[0.06em]", tones[tone], className)}>{children}</p>;
}

/**
 * Section title in the two-tone retail style: "Yangi kelganlar. Eng soʻnggi texnika."
 * The lead continues the title in gray, so a section needs no separate subtitle line.
 */
export function SectionHeader({
  title,
  lead,
  link,
  className,
}: {
  title: string;
  lead?: string;
  link?: { href: string; label: string };
  className?: string;
}) {
  const stop = lead && !/[.?!…]$/.test(title) ? "." : "";
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-x-6 gap-y-2 sm:mb-7", className)}>
      <h2 className="min-w-0 text-balance text-[22px] font-semibold leading-[1.18] tracking-[-0.02em] text-ink sm:text-[26px] lg:text-[28px]">
        {title}
        {stop}
        {lead && <span className="text-muted"> {lead}</span>}
      </h2>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center pb-1 text-[14px] font-medium text-accent hover:underline sm:text-[15px]"
        >
          {link.label}
          <ChevronRight className="size-4 transition group-hover:translate-x-0.5" strokeWidth={2.2} />
        </Link>
      )}
    </div>
  );
}

export function Breadcrumbs({ items, tone = "default" }: { items: { href?: string; label: string }[]; tone?: "default" | "light" }) {
  return (
    <nav aria-label="Breadcrumb" className="no-scrollbar overflow-x-auto">
      <ol className={cn("flex items-center gap-1.5 whitespace-nowrap text-[13px]", tone === "light" ? "text-white/60" : "text-muted")}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className={cn("size-3.5", tone === "light" ? "text-white/40" : "text-subtle")} />}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className={cn("transition", tone === "light" ? "hover:text-white" : "hover:text-ink")}>
                {item.label}
              </Link>
            ) : (
              <span className={tone === "light" ? "text-white" : "text-ink-2"} aria-current={i === items.length - 1 ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
