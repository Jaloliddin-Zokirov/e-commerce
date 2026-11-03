import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { InstagramIcon, TelegramIcon, YoutubeIcon } from "@/components/brand-icons";
import { Logo } from "@/components/logo";
import { telHref } from "@/lib/format";
import { fmt, href, tl, type Dict } from "@/lib/i18n";
import type { Locale, SiteSettings } from "@/lib/types";
import type { MenuCategory } from "./menu-types";

export function SocialLinks({ settings, className }: { settings: SiteSettings; className?: string }) {
  const items = [
    settings.telegramChannel && { href: settings.telegramChannel, label: "Telegram", Icon: TelegramIcon },
    settings.instagram && { href: settings.instagram, label: "Instagram", Icon: InstagramIcon },
    settings.youtube && { href: settings.youtube, label: "YouTube", Icon: YoutubeIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof TelegramIcon }[];
  return (
    <div className={className ?? "flex gap-2"}>
      {items.map(({ href: url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener"
          aria-label={label}
          title={label}
          className="grid size-10 place-items-center rounded-full bg-canvas text-ink transition hover:bg-ink hover:text-white"
        >
          <Icon className="size-[18px]" />
        </a>
      ))}
    </div>
  );
}

export function Footer({
  locale,
  dict,
  settings,
  tree,
}: {
  locale: Locale;
  dict: Dict;
  settings: SiteSettings;
  tree: MenuCategory[];
}) {
  const year = new Date().getFullYear();
  const address = tl(settings.address, locale);
  const hours = tl(settings.workHours, locale);
  const linkClass = "text-ink-2 transition hover:text-ink hover:underline";
  return (
    <footer className="mt-16 border-t border-black/[0.08] bg-white pb-24 lg:mt-24 lg:pb-0">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:py-14">
        <div>
          <Link href={href(locale)} aria-label={settings.storeName} className="inline-block">
            <Logo className="h-8 w-auto" />
          </Link>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">{tl(settings.tagline, locale)}</p>
          <SocialLinks settings={settings} className="mt-5 flex gap-2" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{dict.footer.catalog}</h2>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            {tree.map((c) => (
              <li key={c.id}>
                <Link href={c.href} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{dict.footer.info}</h2>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <Link href={href(locale, "/catalog")} className={linkClass}>
                {dict.nav.allProducts}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "/sale")} className={linkClass}>
                {dict.nav.sale}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "/favorites")} className={linkClass}>
                {dict.nav.favorites}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "/contacts")} className={linkClass}>
                {dict.nav.contacts}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{dict.footer.contacts}</h2>
          <ul className="mt-4 space-y-3 text-[14px] text-ink-2">
            {settings.phones.map((p) => (
              <li key={p}>
                <a href={telHref(p)} className="flex items-center gap-2 text-[17px] font-semibold text-ink tabular hover:text-accent">
                  <Phone className="size-4 text-muted" />
                  {p}
                </a>
              </li>
            ))}
            {hours && (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted" />
                {hours}
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                <Link href={href(locale, "/contacts")} className={linkClass}>
                  {address}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-black/[0.06]">
        <div className="container-page flex flex-col gap-2 py-5 text-[12.5px] text-subtle md:flex-row md:items-center md:justify-between">
          <span>{fmt(dict.footer.rights, { year, store: settings.storeName })}</span>
          <span className="max-w-xl md:text-right">{dict.footer.priceNote}</span>
        </div>
      </div>
    </footer>
  );
}
