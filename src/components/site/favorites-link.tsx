"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { href } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSite } from "./site-context";
import { useFavorites } from "./stores";

export function FavoritesCount({ className }: { className?: string }) {
  const { ids } = useFavorites();
  if (ids.length === 0) return null;
  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sale px-1 text-[11px] font-bold leading-none text-white tabular",
        className,
      )}
    >
      {ids.length > 99 ? "99+" : ids.length}
    </span>
  );
}

export function FavoritesLink({ className }: { className?: string }) {
  const { dict, locale } = useSite();
  return (
    <Link
      href={href(locale, "/favorites")}
      aria-label={dict.nav.favorites}
      title={dict.nav.favorites}
      className={cn("relative grid size-11 place-items-center rounded-full transition hover:bg-canvas", className)}
    >
      <Heart className="size-[22px] text-ink" strokeWidth={1.8} />
      <FavoritesCount />
    </Link>
  );
}
