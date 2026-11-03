"use client";

import { useEffect, useState } from "react";
import type { CardData } from "@/lib/view";
import { ProductCard } from "./product-card";
import { Rail, RailItem } from "./rail";
import { SectionHeader } from "./section";
import { useSite } from "./site-context";
import { useRecentlyViewed } from "./stores";

/** Cards for a list of ids; null while loading. */
export function useCards(ids: number[]): CardData[] | null {
  const { locale } = useSite();
  const [result, setResult] = useState<{ key: string; cards: CardData[] } | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${key}&locale=${locale}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((data: { cards: CardData[] }) => setResult({ key, cards: data.cards }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [key, locale]);
  if (!key) return [];
  if (result?.key === key) return result.cards;
  // Removing items (e.g. un-favoriting) needs no loading state: reuse what we have.
  const known = new Map(result?.cards.map((c) => [c.id, c]));
  return ids.every((id) => known.has(id)) ? ids.map((id) => known.get(id)!) : null;
}

/** Records a product view (rendered on the product page). */
export function TrackView({ id }: { id: number }) {
  const { push } = useRecentlyViewed();
  useEffect(() => push(id), [id, push]);
  return null;
}

export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const { dict } = useSite();
  const { ids } = useRecentlyViewed();
  const cards = useCards(ids.filter((id) => id !== excludeId).slice(0, 12));
  if (!cards || cards.length === 0) return null;
  return (
    <section className="container-page mt-14 lg:mt-20">
      <SectionHeader title={dict.home.recentlyViewed} />
      <Rail label={dict.home.recentlyViewed}>
        {cards.map((card) => (
          <RailItem key={card.id}>
            <ProductCard card={card} />
          </RailItem>
        ))}
      </Rail>
    </section>
  );
}
