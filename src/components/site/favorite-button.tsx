"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSite } from "./site-context";
import { useFavorites } from "./stores";

export function FavoriteButton({
  id,
  className,
  size = "md",
}: {
  id: number;
  className?: string;
  size?: "md" | "lg";
}) {
  const { dict } = useSite();
  const { has, toggle } = useFavorites();
  const active = has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={active}
      aria-label={active ? dict.product.removeFavorite : dict.product.addFavorite}
      title={active ? dict.product.removeFavorite : dict.product.addFavorite}
      className={cn(
        "grid place-items-center rounded-full transition active:scale-90",
        size === "lg"
          ? "size-12 bg-white shadow-tile hover:shadow-tile-hover"
          : "size-9 bg-white/90 shadow-[0_1px_4px_rgb(0_0_0/0.08)] backdrop-blur hover:bg-white",
        className,
      )}
    >
      <Heart
        className={cn(
          size === "lg" ? "size-[22px]" : "size-[18px]",
          active ? "fill-sale text-sale" : "text-ink-2",
        )}
        strokeWidth={2}
      />
    </button>
  );
}
