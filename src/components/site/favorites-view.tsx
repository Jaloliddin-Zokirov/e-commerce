"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { href } from "@/lib/i18n";
import { ProductCard } from "./product-card";
import { useCards } from "./recently-viewed";
import { useSite } from "./site-context";
import { useFavorites } from "./stores";

export function FavoritesView() {
  const { dict, locale } = useSite();
  const { ids, clear } = useFavorites();
  const cards = useCards(ids);

  return (
    <div className="container-page pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.028em] sm:text-[40px] lg:text-[48px]">{dict.favorites.title}</h1>
        {ids.length > 0 && (
          <button type="button" onClick={clear} className="btn btn-soft btn-sm">
            {dict.favorites.clear}
          </button>
        )}
      </div>
      {cards === null && ids.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {ids.slice(0, 8).map((id) => (
            <div key={id} className="aspect-[3/4] animate-pulse rounded-[18px] bg-white" />
          ))}
        </div>
      ) : cards && cards.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {cards.map((card) => (
            <ProductCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-[18px] bg-white px-6 py-16 text-center shadow-tile">
          <span className="grid size-16 place-items-center rounded-full bg-sale-soft">
            <Heart className="size-8 text-sale" />
          </span>
          <h2 className="mt-4 text-[20px] font-semibold">{dict.favorites.empty}</h2>
          <p className="mt-2 max-w-sm text-[15px] text-muted">{dict.favorites.emptyHint}</p>
          <Link href={href(locale, "/catalog")} className="btn btn-primary mt-6">
            {dict.nav.catalog}
          </Link>
        </div>
      )}
    </div>
  );
}
