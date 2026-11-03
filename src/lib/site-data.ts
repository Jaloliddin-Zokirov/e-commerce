import "server-only";
import { href, tl } from "./i18n";
import { buildTree, listCategories } from "./repo/categories";
import type { Category, Locale } from "./types";
import type { MenuCategory } from "@/components/site/menu-types";

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function categoryHref(locale: Locale, c: Pick<Category, "slug">): string {
  return href(locale, `/catalog/${c.slug}`);
}

export function menuTree(locale: Locale, categories = listCategories({ activeOnly: true })): MenuCategory[] {
  return buildTree(categories).map((root) => ({
    id: root.id,
    name: tl(root.name, locale),
    href: categoryHref(locale, root),
    image: root.image,
    children: root.children.map((c) => ({
      id: c.id,
      name: tl(c.name, locale),
      href: categoryHref(locale, c),
      image: c.image,
    })),
  }));
}

/** Absolute alternates for <link rel="alternate" hreflang>. */
export function alternates(locale: Locale, path: string) {
  const base = siteUrl();
  const clean = path === "/" ? "" : path;
  return {
    canonical: `${base}/${locale}${clean}`,
    languages: {
      uz: `${base}/uz${clean}`,
      ru: `${base}/ru${clean}`,
      "x-default": `${base}/uz${clean}`,
    },
  };
}
