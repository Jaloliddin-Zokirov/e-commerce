import Link from "next/link";
import { Img } from "@/components/img";
import { cn } from "@/lib/utils";
import type { BadgeTone, CardData, StockTone } from "@/lib/view";
import { FavoriteButton } from "./favorite-button";
import { Money } from "./money";

const BADGE: Record<BadgeTone, string> = {
  sale: "bg-sale text-white",
  new: "bg-new-soft text-new",
  hit: "bg-ink text-white",
  refurb: "bg-accent-soft text-accent",
};

export const STOCK_DOT: Record<StockTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  muted: "bg-subtle",
};

export function Badges({ badges, className }: { badges: CardData["badges"]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => (
        <span
          key={b.label}
          className={cn("inline-flex h-6 items-center rounded-md px-2 text-[12px] font-semibold tracking-[-0.005em]", BADGE[b.tone])}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("grid size-full place-items-center", className)}>
      <svg viewBox="0 0 64 64" className="size-1/3 text-line-2" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="12" width="48" height="40" rx="8" />
        <circle cx="24" cy="28" r="5" />
        <path d="m10 48 14-12 10 8 8-6 12 10" />
      </svg>
    </div>
  );
}

/** Product tile in the retail style: white card, photo on white, a clear name and price. */
export function ProductCard({
  card,
  priority = false,
  className,
}: {
  card: CardData;
  priority?: boolean;
  className?: string;
}) {
  const { price } = card;
  const sale = card.badges.find((b) => b.tone === "sale");
  const labels = card.badges.filter((b) => b.tone !== "sale");
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[18px] bg-white shadow-tile transition-[box-shadow,transform] duration-300 ease-out hover:scale-[1.01] hover:shadow-tile-hover",
        className,
      )}
    >
      <div className="relative aspect-square">
        {card.image ? (
          <Img
            asset={card.image}
            alt={card.name}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 50vw"
            width={640}
            priority={priority}
            className="size-full object-contain p-5 sm:p-7"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {sale && (
          <span className="absolute left-3 top-3 inline-flex h-6 items-center rounded-md bg-sale px-2 text-[12px] font-semibold text-white sm:left-4 sm:top-4">
            {sale.label}
          </span>
        )}
        <FavoriteButton id={card.id} className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3" />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        {labels.length > 0 && (
          <p className="mb-1.5 truncate text-[11.5px] font-semibold uppercase tracking-[0.04em] text-new sm:text-[12px]">
            {labels.map((b) => b.label).join(" · ")}
          </p>
        )}
        <h3 className="text-[15px] font-semibold leading-[1.3] tracking-[-0.012em] text-ink sm:text-[17px]">
          <Link
            href={card.href}
            className="line-clamp-2 after:absolute after:inset-0 after:rounded-[18px] after:content-[''] focus-visible:outline-none"
          >
            {card.name}
          </Link>
        </h3>
        {card.tagline && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted sm:text-[14px]">{card.tagline}</p>}

        {card.colors.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5" aria-label={card.colors.map((c) => c.label).join(", ")}>
            {card.colors.slice(0, 6).map((c) => (
              <span
                key={c.hex + c.label}
                title={c.label}
                className="size-2.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {card.colors.length > 6 && <span className="text-[12px] text-muted">+{card.colors.length - 6}</span>}
          </div>
        )}

        <div className="mt-auto pt-4">
          {price.onRequest ? (
            <div className="text-[15px] font-semibold text-accent">{price.main}</div>
          ) : (
            <>
              <Money
                value={price.main}
                locale={card.locale}
                from={price.from}
                className={cn("block text-[15px] font-semibold leading-tight tracking-[-0.01em] sm:text-[17px]", price.old ? "text-sale" : "text-ink")}
                unitClassName="text-[13px] font-medium sm:text-[14px]"
              />
              {price.old && <div className="mt-0.5 text-[13px] text-subtle line-through tabular">{price.old}</div>}
            </>
          )}
          {price.alt && <div className="mt-0.5 text-[12px] text-muted tabular">≈ {price.alt}</div>}
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
            <span className={cn("size-1.5 shrink-0 rounded-full", STOCK_DOT[card.stock.tone])} />
            <span className="truncate">{card.stock.label}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
