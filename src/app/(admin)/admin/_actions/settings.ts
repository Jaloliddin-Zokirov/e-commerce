"use server";

import { revalidatePath } from "next/cache";
import { checkPassword, requireAdmin, setPassword, startSession } from "@/lib/auth";
import { issuesToErrors, settingsInput } from "@/lib/admin/schemas";
import { getDb } from "@/lib/db";
import { cleanupOrphans, deleteAssets } from "@/lib/images";
import { notifyTelegram } from "@/lib/notify";
import { listBanners } from "@/lib/repo/banners";
import { queryProducts, referencedImageIds, reindexProducts } from "@/lib/repo/products";
import { getSettings, saveSettings } from "@/lib/repo/settings";
import type { SiteSettings } from "@/lib/types";

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string; errors?: Record<string, string> };

export async function saveSettingsAction(
  raw: SiteSettings,
  opts: { convertPrices?: boolean } = {},
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsInput.safeParse(raw);
  if (!parsed.success) {
    const errors = issuesToErrors(parsed.error.issues);
    return { ok: false, message: Object.values(errors)[0] ?? "Maydonlarni tekshiring", errors };
  }
  const next = parsed.data as SiteSettings;
  next.phones = next.phones.filter(Boolean);
  const before = getSettings();

  // Switching the input currency can convert stored prices so they keep their meaning.
  if (opts.convertPrices && before.currency.base !== next.currency.base) {
    const rate = next.currency.rate;
    const factor = next.currency.base === "UZS" ? rate : 1 / rate;
    const round = (v: number) => (next.currency.base === "UZS" ? Math.round((v * factor) / 1000) * 1000 : Math.round(v * factor));
    const db = getDb();
    const rows = db.prepare("SELECT id, price, old_price, variants FROM products").all() as {
      id: number;
      price: number;
      old_price: number | null;
      variants: string;
    }[];
    const update = db.prepare("UPDATE products SET price = ?, old_price = ?, variants = ? WHERE id = ?");
    db.transaction(() => {
      for (const r of rows) {
        const variants = (JSON.parse(r.variants) as { price: number; oldPrice: number | null }[]).map((v) => ({
          ...v,
          price: round(v.price),
          oldPrice: v.oldPrice ? round(v.oldPrice) : null,
        }));
        update.run(round(r.price), r.old_price ? round(r.old_price) : null, JSON.stringify(variants), r.id);
      }
    })();
    saveSettings(next);
    reindexProducts();
  } else {
    saveSettings(next);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Sozlamalar saqlandi" };
}

export async function changePasswordAction(current: string, next: string): Promise<ActionResult> {
  await requireAdmin();
  if (!checkPassword(current)) return { ok: false, message: "Joriy parol notoʻgʻri" };
  if (next.length < 8) return { ok: false, message: "Yangi parol kamida 8 belgidan iborat boʻlsin" };
  setPassword(next);
  await startSession();
  return { ok: true, message: "Parol yangilandi" };
}

/** Today's official USD rate from the Central Bank of Uzbekistan. */
export async function fetchCbuRateAction(): Promise<{ ok: true; rate: number; date: string } | { ok: false; message: string }> {
  await requireAdmin();
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/", { signal: AbortSignal.timeout(8000), cache: "no-store" });
    const data = (await res.json()) as { Rate: string; Date: string }[];
    const rate = Number(data?.[0]?.Rate);
    if (!rate) throw new Error("bad rate");
    return { ok: true, rate: Math.round(rate), date: data[0].Date };
  } catch {
    return { ok: false, message: "Markaziy bank saytiga ulanib boʻlmadi. Kursni qoʻlda kiriting." };
  }
}

export async function testTelegramAction(token: string, chatId: string): Promise<ActionResult> {
  await requireAdmin();
  const settings = { ...getSettings(), telegramBot: { token, chatId } };
  const ok = await notifyTelegram(settings, "✅ <b>PRODUCT</b>: Telegram xabarnomalari ishlayapti.");
  return ok
    ? { ok: true, message: "Test xabar yuborildi" }
    : { ok: false, message: "Yuborilmadi. Token va chat ID ni tekshiring, botga /start yozganingizga ishonch hosil qiling." };
}

export async function deleteDemoDataAction(): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();
  const demoProducts = queryProducts({ includeDrafts: true, limit: 500 }).items.filter((p) => p.isDemo);
  const demoBanners = listBanners().filter((b) => b.isDemo);
  db.transaction(() => {
    db.prepare("DELETE FROM products WHERE is_demo = 1").run();
    db.prepare("DELETE FROM banners WHERE is_demo = 1").run();
  })();
  await deleteAssets([
    ...demoProducts.flatMap((p) => p.images),
    ...demoBanners.flatMap((b) => [b.image, b.imageMobile]),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: `${demoProducts.length} ta demo mahsulot va ${demoBanners.length} ta banner oʻchirildi` };
}

export async function cleanupImagesAction(): Promise<ActionResult> {
  await requireAdmin();
  const removed = await cleanupOrphans(referencedImageIds());
  return { ok: true, message: removed ? `${removed} ta keraksiz fayl oʻchirildi` : "Keraksiz fayl topilmadi" };
}
