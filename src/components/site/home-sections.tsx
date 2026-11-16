import Link from "next/link";
import { Check, Clock, MapPin, MessagesSquare, Navigation, Phone, ShieldCheck, Store, Zap } from "lucide-react";
import { TelegramIcon } from "@/components/brand-icons";
import { Img } from "@/components/img";
import { telHref } from "@/lib/format";
import { fmt, tl, type Dict } from "@/lib/i18n";
import { googleMapsUrl, telegramChatUrl, yandexEmbedUrl, yandexRouteUrl } from "@/lib/links";
import type { ImageAsset, Locale, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { CardData } from "@/lib/view";
import { Money } from "./money";
import { OpenStatus } from "./open-status";
import { OrderButton, type OrderProduct } from "./order-dialog";
import { ProductCard } from "./product-card";
import { Rail, RailItem } from "./rail";
import { Eyebrow, SectionHeader } from "./section";
import { ShowcaseTabs } from "./showcase-tabs";

/* ---------- Categories ---------- */

export type ShelfItem = { id: number; name: string; href: string; image: ImageAsset | null; count: string };

export function CategoryShelf({ title, lead, items }: { title: string; lead: string; items: ShelfItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="container-page mt-10 sm:mt-14">
      <SectionHeader title={title} lead={lead} />
      <ul className="no-scrollbar scroll-room -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:gap-4 lg:overflow-visible lg:px-0">
        {items.map((c) => (
          <li key={c.id} className="w-[124px] shrink-0 snap-start lg:w-auto">
            <Link
              href={c.href}
              className="group flex h-full flex-col items-center rounded-[18px] bg-white px-2 pb-4 pt-5 text-center shadow-tile transition-[box-shadow,transform] duration-300 ease-out hover:scale-[1.02] hover:shadow-tile-hover"
            >
              <span className="grid h-[84px] w-full place-items-center">
                {c.image && <Img asset={c.image} alt="" width={320} sizes="120px" className="max-h-full w-auto max-w-[88%] object-contain" />}
              </span>
              <span className="mt-3 text-[14px] font-semibold leading-tight text-ink">{c.name}</span>
              <span className="mt-0.5 text-[12px] text-muted">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Product rows ---------- */

export function ProductRailSection({
  title,
  lead,
  link,
  cards,
}: {
  title: string;
  lead?: string;
  link?: { href: string; label: string };
  cards: CardData[];
}) {
  if (cards.length === 0) return null;
  return (
    <section className="container-page mt-12 sm:mt-16">
      <SectionHeader title={title} lead={lead} link={link} />
      <Rail label={title}>
        {cards.map((card) => (
          <RailItem key={card.id}>
            <ProductCard card={card} />
          </RailItem>
        ))}
      </Rail>
    </section>
  );
}

/* ---------- Deal of the week ---------- */

export type Deal = {
  card: CardData;
  pct: number;
  price: string;
  old: string;
  saving: string;
  variant?: string;
  order: OrderProduct;
};

export function DealCard({ deal, dict, locale }: { deal: Deal; dict: Dict; locale: Locale }) {
  const { card } = deal;
  return (
    <section className="container-page mt-12 sm:mt-16">
      <div className="grid overflow-hidden rounded-[24px] bg-white shadow-tile md:grid-cols-2">
        <Link href={card.href} className="group relative block aspect-[4/3] bg-canvas md:aspect-auto md:min-h-[460px]">
          {card.image && (
            <Img
              asset={card.image}
              alt={card.name}
              width={1080}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="absolute inset-0 size-full object-contain p-10 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:p-14"
            />
          )}
          <span className="absolute left-4 top-4 inline-flex h-8 items-center rounded-lg bg-sale px-3 text-[15px] font-semibold text-white sm:left-6 sm:top-6">
            −{deal.pct}%
          </span>
        </Link>
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <Eyebrow tone="sale">{dict.home.dealEyebrow}</Eyebrow>
          <h2 className="mt-2 text-balance text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[36px] lg:text-[40px]">{card.name}</h2>
          {card.tagline && <p className="mt-3 text-[17px] leading-snug text-ink-2">{card.tagline}</p>}
          {deal.variant && <p className="mt-1 text-[14px] text-muted">{deal.variant}</p>}
          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Money
              value={deal.price}
              locale={locale}
              className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-sale sm:text-[32px]"
              unitClassName="text-[17px] font-medium sm:text-[19px]"
            />
            <span className="text-[17px] text-subtle line-through tabular">{deal.old}</span>
          </div>
          <p className="mt-2 text-[15px] font-medium text-ink-2 tabular">{fmt(dict.price.save, { amount: deal.saving })}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <OrderButton product={deal.order} className="btn-lg" />
            <Link href={card.href} className="btn btn-outline btn-lg">
              {dict.common.more}
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-muted">
            {[dict.product.perks.official, dict.product.perks.store].map((perk) => (
              <li key={perk} className="flex items-center gap-1.5">
                <Check className="size-4 text-ok" strokeWidth={2.4} />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- How we work ---------- */

export function ProcessSection({ dict }: { dict: Dict }) {
  return (
    <section className="mt-16 bg-white py-14 sm:mt-20 sm:py-20">
      <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <Eyebrow>{dict.home.processEyebrow}</Eyebrow>
          <h2 className="mt-3 text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[40px] lg:text-[44px]">
            {dict.home.processTitle}
          </h2>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">{dict.home.processText}</p>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-8 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {dict.home.stats.map((s) => (
              <div key={s.label}>
                <dt className="whitespace-nowrap text-[28px] font-semibold leading-none tracking-[-0.02em] tabular sm:text-[32px]">{s.value}</dt>
                <dd className="mt-2 text-[13px] leading-snug text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {dict.home.steps.map((step, i) => (
            <li key={step.title} className="rounded-[18px] bg-canvas p-5 sm:p-6">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-[15px] font-semibold text-white">{i + 1}</span>
              <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em]">{step.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Showcase: hits / featured ---------- */

export type ShowcaseGroup = { key: string; label: string; href: string; cards: CardData[] };

/** Hide the cards that would leave a half-empty last row (2, 3 and 4 columns; at most two rows). */
function fullRows(index: number, total: number) {
  const fit = (cols: number) => Math.min(cols * 2, Math.max(cols, total - (total % cols)));
  return cn(
    index < fit(2) ? "block" : "hidden",
    index < fit(3) ? "sm:block" : "sm:hidden",
    index < fit(4) ? "lg:block" : "lg:hidden",
  );
}

export function Showcase({ dict, groups }: { dict: Dict; groups: ShowcaseGroup[] }) {
  const tabs = groups.filter((g) => g.cards.length > 0);
  if (tabs.length === 0) return null;
  return (
    <section className="container-page mt-12 sm:mt-16">
      <SectionHeader title={dict.home.showcaseTitle} lead={dict.home.showcaseLead} />
      <ShowcaseTabs
        label={dict.home.showcaseTitle}
        allLabel={dict.common.viewAll}
        tabs={tabs.map(({ key, label, href }) => ({ key, label, href }))}
        panels={tabs.map((g) => (
          <div key={g.key} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {g.cards.slice(0, 8).map((card, i) => (
              <div key={card.id} className={fullRows(i, g.cards.length)}>
                <ProductCard card={card} />
              </div>
            ))}
          </div>
        ))}
      />
    </section>
  );
}

/* ---------- Why us ---------- */

const WHY_ICONS = [ShieldCheck, Store, MessagesSquare, Zap];
const WHY_TONES = ["text-ok", "text-accent", "text-new", "text-[#6e4ff5]"];

export function WhySection({ dict }: { dict: Dict }) {
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={dict.home.whyTitle} lead={dict.home.whyLead} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {dict.trust.map((item, i) => {
          const Icon = WHY_ICONS[i % WHY_ICONS.length];
          return (
            <li key={item.title} className="rounded-[18px] bg-white p-6 shadow-tile">
              <Icon className={cn("size-8", WHY_TONES[i % WHY_TONES.length])} strokeWidth={1.6} />
              <h3 className="mt-5 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{item.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Brands ---------- */

export function BrandsStrip({ brands, title }: { brands: { id: number; name: string; href: string; logo: ImageAsset | null }[]; title: string }) {
  if (brands.length === 0) return null;
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={title} />
      <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] lg:gap-4">
        {brands.map((b) => (
          <li key={b.id}>
            <Link
              href={b.href}
              className="grid h-[72px] place-items-center rounded-[18px] bg-white px-4 text-[17px] font-semibold tracking-[-0.01em] text-ink-2 shadow-tile transition-[box-shadow,color] duration-300 hover:text-ink hover:shadow-tile-hover sm:h-20"
            >
              {b.logo ? <Img asset={b.logo} alt={b.name} width={320} sizes="140px" className="max-h-9 w-auto max-w-full object-contain" /> : b.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Telegram ---------- */

export function TelegramBand({ settings, dict }: { settings: SiteSettings; dict: Dict }) {
  if (!settings.telegramChannel && !settings.telegramUser) return null;
  return (
    <section className="container-page mt-16 sm:mt-20">
      <div className="flex flex-col gap-6 rounded-[24px] bg-white p-6 shadow-tile sm:p-10 md:flex-row md:items-center md:gap-10">
        <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-telegram text-white sm:size-20">
          <TelegramIcon className="size-8 sm:size-10" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] sm:text-[28px]">{dict.home.telegramTitle}</h2>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">{dict.home.telegramText}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {settings.telegramChannel && (
            <a href={settings.telegramChannel} target="_blank" rel="noopener" className="btn btn-telegram">
              {dict.home.telegramJoin}
            </a>
          )}
          {settings.telegramUser && (
            <a href={telegramChatUrl(settings.telegramUser)} target="_blank" rel="noopener" className="btn btn-outline">
              {dict.home.telegramWrite}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Store ---------- */

export function StoreInfoList({ settings, locale, dict }: { settings: SiteSettings; locale: Locale; dict: Dict }) {
  const address = tl(settings.address, locale);
  const landmark = tl(settings.landmark, locale);
  const hours = tl(settings.workHours, locale);
  return (
    <ul className="space-y-4 text-[15px]">
      {address && (
        <li className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas">
            <MapPin className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] text-muted">{dict.common.address}</div>
            <div className="font-medium leading-snug">{address}</div>
            {landmark && (
              <div className="mt-0.5 text-[13px] text-muted">
                {dict.common.landmark}: {landmark}
              </div>
            )}
          </div>
        </li>
      )}
      {hours && (
        <li className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas">
            <Clock className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] text-muted">{dict.common.workHours}</div>
            <div className="font-medium">{hours}</div>
          </div>
        </li>
      )}
      {settings.phones.length > 0 && (
        <li className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas">
            <Phone className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] text-muted">{dict.common.phone}</div>
            {settings.phones.map((p) => (
              <a key={p} href={telHref(p)} className="block text-[17px] font-semibold tabular hover:text-accent">
                {p}
              </a>
            ))}
          </div>
        </li>
      )}
    </ul>
  );
}

export function MapEmbed({ settings, locale, className }: { settings: SiteSettings; locale: Locale; className?: string }) {
  const { lat, lng, zoom } = settings.map;
  return (
    <iframe
      src={yandexEmbedUrl(lat, lng, zoom, locale)}
      title="Map"
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      className={className ?? "size-full border-0"}
    />
  );
}

export function VisitStore({ settings, locale, dict }: { settings: SiteSettings; locale: Locale; dict: Dict }) {
  const { lat, lng } = settings.map;
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={dict.home.visitTitle} lead={dict.home.visitLead} />
      <div className="grid overflow-hidden rounded-[24px] bg-white shadow-tile lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="p-6 sm:p-10">
          <OpenStatus hours={tl(settings.workHours, locale)} />
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">{dict.home.visitText}</p>
          <div className="mt-7">
            <StoreInfoList settings={settings} locale={locale} dict={dict} />
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <a href={yandexRouteUrl(lat, lng)} target="_blank" rel="noopener" className="btn btn-primary">
              <Navigation className="size-[18px]" /> {dict.common.directions}
            </a>
            <a href={googleMapsUrl(lat, lng)} target="_blank" rel="noopener" className="btn btn-outline">
              {dict.common.googleMaps}
            </a>
          </div>
        </div>
        <div className="relative min-h-[320px] bg-canvas lg:min-h-[480px]">
          <MapEmbed settings={settings} locale={locale} className="absolute inset-0 size-full border-0" />
        </div>
      </div>
    </section>
  );
}
