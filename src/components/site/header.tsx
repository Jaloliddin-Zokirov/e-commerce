import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { telHref } from "@/lib/format";
import { href, tl, type Dict } from "@/lib/i18n";
import type { Locale, SiteSettings } from "@/lib/types";
import { CatalogMenu } from "./catalog-menu";
import { FavoritesLink } from "./favorites-link";
import { LanguageSwitcher } from "./language-switcher";
import type { MenuCategory } from "./menu-types";
import { MobileMenu } from "./mobile-menu";
import { MobileSearchButton } from "./mobile-search";
import { NavLinks } from "./nav-links";
import { SearchBox } from "./search-box";

export function AnnouncementBar({ settings, locale }: { settings: SiteSettings; locale: Locale }) {
  const { announcement } = settings;
  const text = tl(announcement.text, locale);
  if (!announcement.enabled || !text) return null;
  const link = announcement.link.trim();
  const content = <span className="truncate">{text}</span>;
  return (
    <div className="border-b border-black/[0.05] bg-canvas text-ink-2">
      <div className="container-page flex h-9 items-center justify-center text-center text-[12.5px] sm:text-[13px]">
        {link ? (
          <Link
            href={link.startsWith("/") ? href(locale, link) : link}
            className="flex min-w-0 items-center gap-1 hover:text-ink"
          >
            {content} <span className="shrink-0 text-accent">›</span>
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

export function Header({
  locale,
  dict,
  settings,
  tree,
  navLinks,
}: {
  locale: Locale;
  dict: Dict;
  settings: SiteSettings;
  tree: MenuCategory[];
  navLinks: { href: string; label: string; tone?: "sale" }[];
}) {
  const phone = settings.phones[0];
  const workHours = tl(settings.workHours, locale);
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/[0.94] backdrop-blur-xl backdrop-saturate-150">
      <div className="container-page flex h-16 items-center gap-1.5 sm:gap-3 lg:h-[72px] lg:gap-5">
        <div className="-ml-2 lg:hidden">
          <MobileMenu
            tree={tree}
            address={tl(settings.address, locale)}
            workHours={workHours}
            instagram={settings.instagram}
            telegramChannel={settings.telegramChannel}
          />
        </div>
        <Link href={href(locale)} className="shrink-0" aria-label={settings.storeName}>
          <Logo className="h-6 w-auto sm:h-7 lg:h-8" />
        </Link>
        <div className="hidden lg:block">
          <CatalogMenu tree={tree} />
        </div>
        <SearchBox className="hidden max-w-xl flex-1 lg:block" />
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {phone && (
            <a href={telHref(phone)} className="mr-3 hidden flex-col items-end leading-tight xl:flex">
              <span className="text-[15px] font-semibold tracking-[-0.01em] tabular">{phone}</span>
              {workHours && <span className="text-[12px] text-muted">{workHours}</span>}
            </a>
          )}
          <MobileSearchButton className="grid size-10 place-items-center rounded-full transition hover:bg-canvas lg:hidden" />
          {phone && (
            <a
              href={telHref(phone)}
              aria-label={dict.common.call}
              className="grid size-10 place-items-center rounded-full transition hover:bg-canvas max-[359px]:hidden xl:hidden"
            >
              <Phone className="size-[20px]" strokeWidth={1.8} />
            </a>
          )}
          <FavoritesLink className="hidden lg:grid" />
          <LanguageSwitcher className="ml-1" />
        </div>
      </div>
      <nav className="hidden border-t border-black/[0.05] lg:block" aria-label={dict.nav.catalog}>
        <div className="container-page flex h-11 items-center justify-between gap-6">
          <NavLinks links={navLinks} />
          <span className="hidden shrink-0 text-[13px] text-muted xl:block">{tl(settings.tagline, locale)}</span>
        </div>
      </nav>
    </header>
  );
}
