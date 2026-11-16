import type Database from "better-sqlite3";
import { DEFAULT_SETTINGS } from "./defaults";
import type { Localized } from "./types";

/**
 * Schema v4: the store became a no-name placeholder. Removes the earlier "PRODUCT" brand from a
 * database created before that: store name, its default texts, the two demo PC builds, their
 * brand and the hero slide that named it. A fresh database is still empty here, so this is a no-op.
 */

/** Settings texts that came with the old brand; they take today's defaults while the store still carries it. */
const BRAND_TEXTS = ["tagline", "about", "announcement.text", "seo.title", "seo.description"];

const OLD_BUILDS = [
  { slug: "product-creator-pc", next: "creator-pc", sku: ["PD-CREATOR", "PC-CREATOR"], name: ["PRODUCT Creator", "Creator PC"] },
  { slug: "product-gaming-pc", next: "gaming-pc", sku: ["PD-GAMING", "PC-GAMING"], name: ["PRODUCT Gaming", "Gaming PC"] },
] as const;

/** Sentences of the old demo descriptions that described the old brand's service. */
const OLD_SENTENCES: Array<[string, string]> = [
  [" Qaysi dasturlardan foydalanishingizni ayting — konfiguratsiyani moslab, yigʻib, sozlab beramiz.", ""],
  ["Windows va kerakli dasturlar oʻrnatilgan holda topshiriladi", "Windows 11 Pro oʻrnatilgan holda topshiriladi"],
  [" Расскажите, какими программами пользуетесь, — подберём конфигурацию, соберём и настроим.", ""],
  ["Выдаём с установленной Windows и нужными программами", "Выдаём с установленной Windows 11 Pro"],
  [" Game klublar uchun ham yigʻib beramiz.", ""],
  [" Собираем и для компьютерных клубов.", ""],
];

/** The old brand as a word; Apple's "(PRODUCT)RED" is left alone. */
const BRAND = /(?<!\()\bPRODUCT\b(?!\))/g;

function replaceAll(text: string, pairs: ReadonlyArray<readonly [string, string]>): string {
  return pairs.reduce((t, [from, to]) => t.split(from).join(to), text);
}

function renameSettings(db: Database.Database, name: string): void {
  const row = db.prepare("SELECT value FROM kv WHERE key = 'site'").get() as { value: string } | undefined;
  if (!row) return;
  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(row.value) as Record<string, unknown>;
  } catch {
    return;
  }
  if (typeof settings.storeName === "string" && new RegExp(BRAND.source).test(settings.storeName)) {
    for (const path of BRAND_TEXTS) {
      const [head, tail] = path.split(".");
      const parent = tail ? settings[head] : settings;
      const fresh = tail
        ? (DEFAULT_SETTINGS[head as keyof typeof DEFAULT_SETTINGS] as unknown as Record<string, Localized>)[tail]
        : (DEFAULT_SETTINGS[head as keyof typeof DEFAULT_SETTINGS] as Localized);
      if (parent && typeof parent === "object") (parent as Record<string, unknown>)[tail ?? head] = { ...fresh };
    }
  }
  // Whatever still says PRODUCT (the store name, texts the owner wrote) gets the placeholder name.
  db.prepare("UPDATE kv SET value = ? WHERE key = 'site'").run(JSON.stringify(settings).replace(BRAND, name));
}

export function removeOldBrand(db: Database.Database): void {
  const name = DEFAULT_SETTINGS.storeName;
  renameSettings(db, name);

  const brand = db.prepare("SELECT id FROM brands WHERE slug = 'product'").get() as { id: number } | undefined;

  for (const build of OLD_BUILDS) {
    const row = db.prepare("SELECT id FROM products WHERE slug = ?").get(build.slug) as { id: number } | undefined;
    if (!row) continue;
    if (!db.prepare("SELECT 1 FROM products WHERE slug = ?").get(build.next)) {
      db.prepare("UPDATE products SET slug = ? WHERE id = ?").run(build.next, row.id);
    }
    db.prepare("UPDATE products SET sku = ? WHERE id = ? AND sku = ?").run(build.sku[1], row.id, build.sku[0]);
  }

  const names: Array<[string, string]> = OLD_BUILDS.map((b) => [b.name[0], b.name[1]]);
  // search_text is lower-cased, so the same renames are applied in lower case there.
  const searchNames: Array<[string, string]> = OLD_BUILDS.flatMap((b) => [
    [b.name[0].toLowerCase(), b.name[1].toLowerCase()] as [string, string],
    [b.sku[0].toLowerCase(), b.sku[1].toLowerCase()] as [string, string],
  ]);
  const products = db
    .prepare("SELECT id, brand_id, name_uz, name_ru, description_uz, description_ru, search_text FROM products")
    .all() as {
    id: number;
    brand_id: number | null;
    name_uz: string;
    name_ru: string;
    description_uz: string;
    description_ru: string;
    search_text: string;
  }[];
  const update = db.prepare(
    "UPDATE products SET name_uz = ?, name_ru = ?, description_uz = ?, description_ru = ?, search_text = ? WHERE id = ?",
  );
  for (const p of products) {
    const fix = (text: string) => replaceAll(text, names).replace(BRAND, name);
    let search = replaceAll(p.search_text, searchNames);
    // The brand name was part of the search text of its products.
    if (brand && p.brand_id === brand.id) search = search.replace(/\bproduct\b/g, " ").replace(/\s+/g, " ").trim();
    const next = [fix(p.name_uz), fix(p.name_ru), replaceAll(p.description_uz, OLD_SENTENCES), replaceAll(p.description_ru, OLD_SENTENCES), search];
    const before = [p.name_uz, p.name_ru, p.description_uz, p.description_ru, p.search_text];
    if (next.some((v, i) => v !== before[i])) update.run(...next, p.id);
  }

  if (brand) {
    db.prepare("UPDATE products SET brand_id = NULL WHERE brand_id = ?").run(brand.id);
    db.prepare("DELETE FROM brands WHERE id = ?").run(brand.id);
  }

  const banners = db
    .prepare("SELECT id, title_uz, title_ru, subtitle_uz, subtitle_ru, button_uz, button_ru FROM banners")
    .all() as { id: number; title_uz: string; title_ru: string; subtitle_uz: string; subtitle_ru: string; button_uz: string; button_ru: string }[];
  const updateBanner = db.prepare(
    "UPDATE banners SET title_uz = ?, title_ru = ?, subtitle_uz = ?, subtitle_ru = ?, button_uz = ?, button_ru = ? WHERE id = ?",
  );
  const slide: Array<[string, string]> = [
    ["Endi PRODUCT’da.", "Endi sotuvda."],
    ["Уже в PRODUCT.", "Уже в продаже."],
  ];
  for (const b of banners) {
    const before = [b.title_uz, b.title_ru, b.subtitle_uz, b.subtitle_ru, b.button_uz, b.button_ru];
    const next = before.map((t) => replaceAll(t, slide).replace(BRAND, name));
    if (next.some((v, i) => v !== before[i])) updateBanner.run(...next, b.id);
  }
}
