import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "lucide-react";
import { InstagramIcon, TelegramIcon, YoutubeIcon } from "@/components/brand-icons";
import { RichText } from "@/components/rich-text";
import { MapEmbed, StoreInfoList } from "@/components/site/home-sections";
import { LeadButton } from "@/components/site/lead-dialog";
import { Breadcrumbs } from "@/components/site/section";
import { getDict, href, tl } from "@/lib/i18n";
import { googleMapsUrl, telegramChatUrl, telegramUsername, yandexMapsUrl, yandexRouteUrl } from "@/lib/links";
import { getSettings } from "@/lib/repo/settings";
import { alternates } from "@/lib/site-data";
import { isLocale } from "@/lib/types";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = getSettings();
  return {
    title: getDict(locale).meta.contactsTitle,
    description: `${tl(settings.address, locale)}. ${settings.phones.join(", ")}`,
    alternates: alternates(locale, "/contacts"),
  };
}

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = getSettings();
  const dict = getDict(locale);
  const { lat, lng, zoom } = settings.map;
  const about = tl(settings.about, locale);
  const tgUser = telegramUsername(settings.telegramUser);

  const socials = [
    tgUser && {
      href: telegramChatUrl(tgUser),
      label: dict.contacts.telegramManager,
      handle: `@${tgUser}`,
      Icon: TelegramIcon,
      tone: "bg-telegram text-white",
    },
    settings.telegramChannel && {
      href: settings.telegramChannel,
      label: dict.contacts.telegramChannel,
      handle: settings.telegramChannel.replace(/^https?:\/\//, ""),
      Icon: TelegramIcon,
      tone: "bg-accent-soft text-telegram-strong",
    },
    settings.instagram && {
      href: settings.instagram,
      label: dict.contacts.instagram,
      handle: settings.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, ""),
      Icon: InstagramIcon,
      tone: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white",
    },
    settings.youtube && {
      href: settings.youtube,
      label: dict.contacts.youtube,
      handle: settings.youtube.replace(/^https?:\/\/(www\.)?/, ""),
      Icon: YoutubeIcon,
      tone: "bg-[#ff0033] text-white",
    },
  ].filter(Boolean) as { href: string; label: string; handle: string; Icon: typeof TelegramIcon; tone: string }[];

  return (
    <div className="container-page pt-4 lg:pt-6">
      <Breadcrumbs items={[{ label: dict.nav.home, href: href(locale) }, { label: dict.contacts.title }]} />
      <h1 className="mt-5 text-[32px] font-semibold leading-[1.08] tracking-[-0.028em] sm:text-[40px] lg:text-[48px]">{dict.contacts.title}</h1>
      <p className="mt-2 max-w-2xl text-[16px] text-muted">{dict.contacts.subtitle}</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-[18px] bg-white p-6 shadow-tile sm:p-8">
            <StoreInfoList settings={settings} locale={locale} dict={dict} />
            <div className="mt-7 flex flex-wrap gap-2">
              <a href={yandexRouteUrl(lat, lng)} target="_blank" rel="noopener" className="btn btn-primary">
                <Navigation className="size-[18px]" /> {dict.common.directions}
              </a>
              <a href={yandexMapsUrl(lat, lng, zoom)} target="_blank" rel="noopener" className="btn btn-outline">
                {dict.common.yandexMaps}
              </a>
              <a href={googleMapsUrl(lat, lng)} target="_blank" rel="noopener" className="btn btn-outline">
                {dict.common.googleMaps}
              </a>
            </div>
            <LeadButton className="mt-3 w-full" />
          </div>

          {socials.length > 0 && (
            <div className="rounded-[18px] bg-white p-6 shadow-tile sm:p-8">
              <h2 className="text-[18px] font-semibold">{dict.contacts.socials}</h2>
              <ul className="mt-4 space-y-2">
                {socials.map(({ href: url, label, handle, Icon, tone }) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-canvas"
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${tone}`}>
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold">{label}</span>
                        <span className="block truncate text-[13px] text-muted">{handle}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-[18px] bg-white shadow-tile lg:min-h-0">
          <MapEmbed settings={settings} locale={locale} className="absolute inset-0 size-full border-0" />
        </div>
      </div>

      {about && (
        <section className="mt-4 rounded-[18px] bg-white p-6 shadow-tile sm:p-8 lg:mt-6 lg:p-10">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{dict.contacts.about}</h2>
          <div className="mt-4 max-w-3xl">
            <RichText text={about} />
          </div>
        </section>
      )}
    </div>
  );
}
