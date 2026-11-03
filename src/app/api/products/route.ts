import { priceCtx } from "@/lib/format";
import { queryProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";
import { isLocale } from "@/lib/types";
import { toCard } from "@/lib/view";

export const dynamic = "force-dynamic";

/** Cards for client-side lists (favorites, recently viewed), in the requested order. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale");
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 200);
  if (!isLocale(locale) || ids.length === 0) return Response.json({ cards: [] });
  const ctx = priceCtx(getSettings(), locale);
  const { items } = queryProducts({ ids, limit: ids.length });
  const byId = new Map(items.map((p) => [p.id, p]));
  const cards = ids.flatMap((id) => {
    const p = byId.get(id);
    return p ? [toCard(p, locale, ctx)] : [];
  });
  return Response.json({ cards }, { headers: { "Cache-Control": "no-store" } });
}
