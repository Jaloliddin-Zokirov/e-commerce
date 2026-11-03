import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, SubcategoryChips, type RawSearch } from "@/components/site/catalog";
import { getDict, href, tl } from "@/lib/i18n";
import { buildTree, categoryStats, listCategories } from "@/lib/repo/categories";
import { alternates, categoryHref } from "@/lib/site-data";
import { isLocale } from "@/lib/types";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<RawSearch> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).meta.catalogTitle, alternates: alternates(locale, "/catalog") };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const search = await searchParams;
  const dict = getDict(locale);
  const categories = listCategories({ activeOnly: true });
  const stats = categoryStats(categories);
  const roots = buildTree(categories).filter((c) => (stats.get(c.id)?.count ?? 0) > 0);

  return (
    <CatalogView
      locale={locale}
      search={search}
      basePath={href(locale, "/catalog")}
      title={dict.nav.allProducts}
      crumbs={[{ label: dict.nav.home, href: href(locale) }, { label: dict.nav.catalog }]}
      scope={{}}
      subtitle={dict.catalog.allSubtitle}
      header={
        <SubcategoryChips
          items={[
            { href: href(locale, "/catalog"), label: dict.common.all, active: true },
            ...roots.map((c) => ({
              href: categoryHref(locale, c),
              label: tl(c.name, locale),
              active: false,
              count: stats.get(c.id)?.count,
            })),
          ]}
        />
      }
    />
  );
}
