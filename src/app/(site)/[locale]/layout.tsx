import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../../globals.css";
import { inter } from "../../fonts";
import { ContactFab } from "@/components/site/contact-fab";
import { Footer } from "@/components/site/footer";
import { AnnouncementBar, Header } from "@/components/site/header";
import { SiteProvider } from "@/components/site/site-context";
import { TabBar } from "@/components/site/tab-bar";
import { priceCtx } from "@/lib/format";
import { getDict, href, tl } from "@/lib/i18n";
import { listCategories } from "@/lib/repo/categories";
import { getSettings } from "@/lib/repo/settings";
import { categoryHref, menuTree, siteUrl } from "@/lib/site-data";
import { isLocale } from "@/lib/types";
import { telegramUsername } from "@/lib/links";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: tl(settings.seo.title, locale), template: `%s — ${settings.storeName}` },
    description: tl(settings.seo.description, locale),
    applicationName: settings.storeName,
    openGraph: {
      siteName: settings.storeName,
      locale: locale === "ru" ? "ru_RU" : "uz_UZ",
      type: "website",
    },
    formatDetection: { telephone: false },
  };
}

export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = getSettings();
  const dict = getDict(locale);
  const categories = listCategories({ activeOnly: true });
  const tree = menuTree(locale, categories);
  const navLinks = [
    ...categories.filter((c) => c.inMenu).map((c) => ({ href: categoryHref(locale, c), label: tl(c.name, locale) })),
    { href: href(locale, "/sale"), label: dict.nav.sale, tone: "sale" as const },
  ];

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: settings.storeName,
    url: `${siteUrl()}/${locale}`,
    logo: `${siteUrl()}/icon.svg`,
    telephone: settings.phones[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: tl(settings.address, locale),
      addressLocality: locale === "ru" ? "Ташкент" : "Toshkent",
      addressCountry: "UZ",
    },
    geo: { "@type": "GeoCoordinates", latitude: settings.map.lat, longitude: settings.map.lng },
    sameAs: [settings.telegramChannel, settings.instagram, settings.youtube].filter(Boolean),
  };

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-dvh">
        <SiteProvider
          value={{
            locale,
            dict,
            price: priceCtx(settings, locale),
            storeName: settings.storeName,
            phones: settings.phones,
            telegramUser: telegramUsername(settings.telegramUser),
            siteUrl: siteUrl(),
          }}
        >
          <a
            href="#main"
            className="sr-only z-[200] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            {dict.common.more}
          </a>
          <AnnouncementBar settings={settings} locale={locale} />
          <Header locale={locale} dict={dict} settings={settings} tree={tree} navLinks={navLinks} />
          <main id="main">{children}</main>
          <Footer locale={locale} dict={dict} settings={settings} tree={tree} />
          <TabBar />
          <ContactFab />
        </SiteProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
