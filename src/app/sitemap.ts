import type { MetadataRoute } from "next";
import { listCategories } from "@/lib/repo/categories";
import { queryProducts } from "@/lib/repo/products";
import { siteUrl } from "@/lib/site-data";
import { LOCALES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const entry = (path: string, opts: Partial<MetadataRoute.Sitemap[number]> = {}) =>
    LOCALES.map((locale) => ({
      url: `${base}/${locale}${path}`,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`])) },
      ...opts,
    }));

  const pages = [
    ...entry("", { changeFrequency: "daily", priority: 1 }),
    ...entry("/catalog", { changeFrequency: "daily", priority: 0.9 }),
    ...entry("/sale", { changeFrequency: "daily", priority: 0.8 }),
    ...entry("/contacts", { changeFrequency: "monthly", priority: 0.6 }),
  ];
  const categories = listCategories({ activeOnly: true }).flatMap((c) =>
    entry(`/catalog/${c.slug}`, { changeFrequency: "weekly", priority: 0.8 }),
  );
  const products = queryProducts({ limit: 500 }).items.flatMap((p) =>
    entry(`/product/${p.slug}`, {
      lastModified: new Date(`${p.updatedAt.replace(" ", "T")}Z`),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );
  return [...pages, ...categories, ...products];
}
