import { displayPrice, priceCtx, withFrom } from "@/lib/format";
import { getDict, tl } from "@/lib/i18n";
import { listCategories } from "@/lib/repo/categories";
import { queryProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";
import { categoryHref } from "@/lib/site-data";
import { searchNormalize } from "@/lib/slug";
import { isLocale } from "@/lib/types";
import { toCard } from "@/lib/view";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const locale = url.searchParams.get("locale");
  if (!isLocale(locale) || q.length < 2) return Response.json({ products: [], categories: [], total: 0 });

  const ctx = priceCtx(getSettings(), locale);
  const dict = getDict(locale);
  const { items, total } = queryProducts({ q, limit: 6 });
  const needle = searchNormalize(q).split(" ");
  const categories = listCategories({ activeOnly: true })
    .filter((c) => {
      const hay = searchNormalize(`${c.name.uz} ${c.name.ru}`);
      return needle.some((n) => hay.includes(n));
    })
    .slice(0, 4)
    .map((c) => ({ href: categoryHref(locale, c), name: tl(c.name, locale) }));

  const products = items.map((p) => {
    const card = toCard(p, locale, ctx);
    const ranged = p.maxPrice > p.minPrice;
    const main = displayPrice(p.minPrice, ctx).main;
    return {
      id: p.id,
      href: card.href,
      name: card.name,
      image: card.image,
      price: p.minPrice > 0 ? (ranged ? withFrom(main, locale) : main) : dict.price.onRequest,
      old: card.price.old,
    };
  });
  return Response.json({ products, categories, total }, { headers: { "Cache-Control": "no-store" } });
}
