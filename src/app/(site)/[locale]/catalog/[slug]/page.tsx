import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, SubcategoryChips, type RawSearch } from "@/components/site/catalog";
import { getDict, href, tl } from "@/lib/i18n";
import {
  categoryPath,
  categoryStats,
  descendantIds,
  getCategoryBySlug,
  listCategories,
} from "@/lib/repo/categories";
import { alternates, categoryHref } from "@/lib/site-data";
import { isLocale } from "@/lib/types";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<RawSearch> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const category = getCategoryBySlug(slug);
  if (!category || !category.isActive) return {};
  const name = tl(category.name, locale);
  const dict = getDict(locale);
  return {
    title: name,
    description: `${name} — ${dict.meta.catalogTitle}`,
    alternates: alternates(locale, `/catalog/${category.slug}`),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const category = getCategoryBySlug(slug);
  if (!category || !category.isActive) notFound();
  const search = await searchParams;
  const dict = getDict(locale);
  const categories = listCategories({ activeOnly: true });
  const stats = categoryStats(categories);
  const chain = categoryPath(category, categories);

  // Chips: the top-level group and its sub-categories, so siblings are one tap away.
  const root = chain[0];
  const children = categories.filter((c) => c.parentId === root.id && (stats.get(c.id)?.count ?? 0) > 0);
  const chips =
    children.length > 0
      ? [
          { href: categoryHref(locale, root), label: dict.common.all, active: root.id === category.id, count: stats.get(root.id)?.count },
          ...children.map((c) => ({
            href: categoryHref(locale, c),
            label: tl(c.name, locale),
            active: c.id === category.id,
            count: stats.get(c.id)?.count,
          })),
        ]
      : [];

  return (
    <CatalogView
      locale={locale}
      search={search}
      basePath={categoryHref(locale, category)}
      title={tl(category.name, locale)}
      crumbs={[
        { label: dict.nav.home, href: href(locale) },
        { label: dict.nav.catalog, href: href(locale, "/catalog") },
        ...chain.map((c) => ({ label: tl(c.name, locale), href: categoryHref(locale, c) })),
      ]}
      scope={{ categoryIds: descendantIds(category.id, categories) }}
      subtitle={tl(category.subtitle, locale) || tl(root.subtitle, locale)}
      header={<SubcategoryChips items={chips} />}
    />
  );
}
