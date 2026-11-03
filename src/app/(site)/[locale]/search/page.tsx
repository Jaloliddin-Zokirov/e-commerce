import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogView, type RawSearch } from "@/components/site/catalog";
import { SearchBox } from "@/components/site/search-box";
import { fmt, getDict, href, tl } from "@/lib/i18n";
import { categoryStats, listCategories } from "@/lib/repo/categories";
import { categoryHref } from "@/lib/site-data";
import { isLocale } from "@/lib/types";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<RawSearch> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const q = (await searchParams).q;
  const dict = getDict(locale);
  return {
    title: typeof q === "string" && q.trim() ? fmt(dict.search.resultsFor, { q: q.trim() }) : dict.meta.searchTitle,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const search = await searchParams;
  const dict = getDict(locale);
  const q = typeof search.q === "string" ? search.q.trim().slice(0, 80) : "";

  const categories = listCategories({ activeOnly: true });
  const stats = categoryStats(categories);
  const popular = categories.filter((c) => c.inMenu && (stats.get(c.id)?.count ?? 0) > 0);

  const searchHeader = (
    <div className="mt-5 max-w-2xl">
      <SearchBox key={q} initial={q} />
      {popular.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-muted">{dict.search.popular}:</span>
          {popular.map((c) => (
            <Link key={c.id} href={categoryHref(locale, c)} className="chip min-h-8 text-[13px]">
              {tl(c.name, locale)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  if (!q) {
    return (
      <div className="container-page pt-6">
        <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.028em] sm:text-[40px] lg:text-[48px]">{dict.search.title}</h1>
        {searchHeader}
        <p className="mt-10 text-[15px] text-muted">{dict.search.enterQuery}</p>
      </div>
    );
  }

  return (
    <CatalogView
      locale={locale}
      search={search}
      basePath={href(locale, "/search")}
      title={fmt(dict.search.resultsFor, { q })}
      crumbs={[{ label: dict.nav.home, href: href(locale) }, { label: dict.search.title }]}
      scope={{ q }}
      header={searchHeader}
    />
  );
}
