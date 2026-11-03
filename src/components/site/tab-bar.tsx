"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, MapPin, Percent } from "lucide-react";
import { href } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FavoritesCount } from "./favorites-link";
import { useSite } from "./site-context";

/** Bottom navigation on phones. */
export function TabBar() {
  const { dict, locale } = useSite();
  const pathname = usePathname();
  // Product pages show their own sticky call/Telegram bar instead.
  if (/^\/(uz|ru)\/product\//.test(pathname)) return null;
  const items = [
    { href: href(locale), label: dict.nav.home, icon: House, exact: true },
    { href: href(locale, "/catalog"), label: dict.nav.catalog, icon: LayoutGrid },
    { href: href(locale, "/sale"), label: dict.nav.sale, icon: Percent },
    { href: href(locale, "/favorites"), label: dict.nav.favorites, icon: Heart, badge: true },
    { href: href(locale, "/contacts"), label: dict.nav.contacts, icon: MapPin },
  ];
  return (
    <nav
      aria-label={dict.nav.menu}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[58px] flex-col items-center justify-center gap-1 text-[10.5px] font-medium",
                  active ? "text-ink" : "text-subtle",
                )}
              >
                <span className="relative">
                  <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                  {item.badge && <FavoritesCount className="-right-2.5" />}
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
