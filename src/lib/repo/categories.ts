import "server-only";
import { getDb, parseJson } from "../db";
import type { Category, ImageAsset } from "../types";

type CategoryRow = {
  id: number;
  parent_id: number | null;
  slug: string;
  name_uz: string;
  name_ru: string;
  subtitle_uz: string;
  subtitle_ru: string;
  image: string | null;
  sort: number;
  is_active: number;
  in_menu: number;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    parentId: row.parent_id,
    slug: row.slug,
    name: { uz: row.name_uz, ru: row.name_ru },
    subtitle: { uz: row.subtitle_uz ?? "", ru: row.subtitle_ru ?? "" },
    image: parseJson<ImageAsset | null>(row.image, null),
    sort: row.sort,
    isActive: row.is_active === 1,
    inMenu: row.in_menu === 1,
  };
}

export function listCategories(opts: { activeOnly?: boolean } = {}): Category[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM categories ${opts.activeOnly ? "WHERE is_active = 1" : ""} ORDER BY sort, id`,
    )
    .all() as CategoryRow[];
  return rows.map(mapCategory);
}

export function getCategory(id: number): Category | null {
  const row = getDb().prepare("SELECT * FROM categories WHERE id = ?").get(id) as
    | CategoryRow
    | undefined;
  return row ? mapCategory(row) : null;
}

export function getCategoryBySlug(slug: string): Category | null {
  const row = getDb().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as
    | CategoryRow
    | undefined;
  return row ? mapCategory(row) : null;
}

export type CategoryNode = Category & { children: Category[] };

/** Two-level tree: top-level categories with their direct children. */
export function buildTree(categories: Category[]): CategoryNode[] {
  const ids = new Set(categories.map((c) => c.id));
  const roots = categories.filter((c) => c.parentId === null || !ids.has(c.parentId));
  return roots.map((root) => ({
    ...root,
    children: categories.filter((c) => c.parentId === root.id),
  }));
}

/** The category itself plus every nested child. */
export function descendantIds(id: number, categories: Category[]): number[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) {
    for (const c of categories) if (c.parentId === out[i] && !out.includes(c.id)) out.push(c.id);
  }
  return out;
}

/** Root-first chain for breadcrumbs. */
export function categoryPath(category: Category, categories: Category[]): Category[] {
  const chain: Category[] = [category];
  let current = category;
  while (current.parentId !== null) {
    const parent = categories.find((c) => c.id === current.parentId);
    if (!parent || chain.includes(parent)) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/** Published product counts and cheapest price per category, rolled up to parents. */
export function categoryStats(categories: Category[]): Map<number, { count: number; minPrice: number }> {
  const rows = getDb()
    .prepare(
      `SELECT category_id AS id, COUNT(*) AS count, MIN(CASE WHEN min_price > 0 THEN min_price END) AS minPrice
       FROM products WHERE status = 'published' AND category_id IS NOT NULL GROUP BY category_id`,
    )
    .all() as { id: number; count: number; minPrice: number | null }[];
  const direct = new Map(rows.map((r) => [r.id, r]));
  const stats = new Map<number, { count: number; minPrice: number }>();
  for (const c of categories) {
    let count = 0;
    let minPrice = 0;
    for (const id of descendantIds(c.id, categories)) {
      const r = direct.get(id);
      if (!r) continue;
      count += r.count;
      if (r.minPrice && (minPrice === 0 || r.minPrice < minPrice)) minPrice = r.minPrice;
    }
    stats.set(c.id, { count, minPrice });
  }
  return stats;
}

export type CategoryInput = {
  parentId: number | null;
  slug: string;
  name: { uz: string; ru: string };
  subtitle: { uz: string; ru: string };
  image: ImageAsset | null;
  sort: number;
  isActive: boolean;
  inMenu: boolean;
};

export function saveCategory(input: CategoryInput, id?: number): number {
  const db = getDb();
  const params = {
    parent_id: input.parentId,
    slug: input.slug,
    name_uz: input.name.uz,
    name_ru: input.name.ru,
    subtitle_uz: input.subtitle.uz,
    subtitle_ru: input.subtitle.ru,
    image: input.image ? JSON.stringify(input.image) : null,
    sort: input.sort,
    is_active: input.isActive ? 1 : 0,
    in_menu: input.inMenu ? 1 : 0,
  };
  if (id) {
    db.prepare(
      `UPDATE categories SET parent_id=@parent_id, slug=@slug, name_uz=@name_uz, name_ru=@name_ru,
       subtitle_uz=@subtitle_uz, subtitle_ru=@subtitle_ru,
       image=@image, sort=@sort, is_active=@is_active, in_menu=@in_menu WHERE id=@id`,
    ).run({ ...params, id });
    return id;
  }
  const res = db
    .prepare(
      `INSERT INTO categories (parent_id, slug, name_uz, name_ru, subtitle_uz, subtitle_ru, image, sort, is_active, in_menu)
       VALUES (@parent_id, @slug, @name_uz, @name_ru, @subtitle_uz, @subtitle_ru, @image, @sort, @is_active, @in_menu)`,
    )
    .run(params);
  return Number(res.lastInsertRowid);
}

export function deleteCategory(id: number): Category | null {
  const existing = getCategory(id);
  if (!existing) return null;
  const db = getDb();
  db.transaction(() => {
    // Children move up to the deleted category's parent; products become uncategorized.
    db.prepare("UPDATE categories SET parent_id = ? WHERE parent_id = ?").run(existing.parentId, id);
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  })();
  return existing;
}

export function slugTaken(slug: string, excludeId?: number): boolean {
  const row = getDb()
    .prepare("SELECT id FROM categories WHERE slug = ? AND id != ?")
    .get(slug, excludeId ?? 0);
  return Boolean(row);
}

export function nextCategorySort(parentId: number | null): number {
  const row = getDb()
    .prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM categories WHERE parent_id IS ?")
    .get(parentId) as { m: number };
  return row.m + 10;
}
