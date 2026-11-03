import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, type RawSearch } from "@/components/site/catalog";
import { getDict, href } from "@/lib/i18n";
import { alternates } from "@/lib/site-data";
import { isLocale } from "@/lib/types";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<RawSearch> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDict(locale);
  return { title: dict.meta.saleTitle, description: dict.meta.saleDescription, alternates: alternates(locale, "/sale") };
}

export default async function SalePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const search = await searchParams;
  const dict = getDict(locale);
  return (
    <CatalogView
      locale={locale}
      search={{ sort: "discount", ...search }}
      basePath={href(locale, "/sale")}
      title={dict.nav.sale}
      crumbs={[{ label: dict.nav.home, href: href(locale) }, { label: dict.nav.sale }]}
      scope={{ onSale: true }}
      subtitle={dict.catalog.saleSubtitle}
    />
  );
}
