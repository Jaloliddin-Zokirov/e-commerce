import "server-only";
import { getDb, parseJson } from "../db";
import { deriveProduct } from "../product-utils";
import { searchNormalize, slugify } from "../slug";
import type {
  Condition,
  ImageAsset,
  Localized,
  Product,
  ProductOption,
  ProductStatus,
  ProductVariant,
  SpecGroup,
  StockStatus,
} from "../types";

type ProductRow = {
  id: number;
  slug: string;
  category_id: number | null;
  brand_id: number | null;
  sku: string;
  name_uz: string;
  name_ru: string;
  tagline_uz: string;
  tagline_ru: string;
  description_uz: string;
  description_ru: string;
  warranty_uz: string;
  warranty_ru: string;
  condition: Condition;
  price: number;
  old_price: number | null;
  stock: StockStatus;
  images: string;
  options: string;
  variants: string;
  specs: string;
  is_new: number;
  is_hit: number;
  is_featured: number;
  status: ProductStatus;
  sort: number;
  min_price: number;
  max_price: number;
  min_old_price: number | null;
  discount_pct: number;
  in_stock: number;
  views: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
};

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    brandId: row.brand_id,
    sku: row.sku,
    name: { uz: row.name_uz, ru: row.name_ru },
    tagline: { uz: row.tagline_uz, ru: row.tagline_ru },
    description: { uz: row.description_uz, ru: row.description_ru },
    warranty: { uz: row.warranty_uz, ru: row.warranty_ru },
    condition: row.condition,
    price: row.price,
    oldPrice: row.old_price,
    stock: row.stock,
    images: parseJson<ImageAsset[]>(row.images, []),
    options: parseJson<ProductOption[]>(row.options, []),
    variants: parseJson<ProductVariant[]>(row.variants, []),
    specs: parseJson<SpecGroup[]>(row.specs, []),
    isNew: row.is_new === 1,
    isHit: row.is_hit === 1,
    isFeatured: row.is_featured === 1,
    status: row.status,
    sort: row.sort,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    minOldPrice: row.min_old_price,
    discountPct: row.discount_pct,
    inStock: row.in_stock === 1,
    views: row.views,
    isDemo: row.is_demo === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SortKey = "popular" | "new" | "price_asc" | "price_desc" | "discount";
export const SORT_KEYS: SortKey[] = ["popular", "new", "price_asc", "price_desc", "discount"];

export type ProductQuery = {
  categoryIds?: number[];
  brandIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  conditions?: Condition[];
  q?: string;
  isNew?: boolean;
  isHit?: boolean;
  isFeatured?: boolean;
  ids?: number[];
  excludeIds?: number[];
  /** Admin listings see drafts too. */
  includeDrafts?: boolean;
  status?: ProductStatus;
  stock?: StockStatus;
  sort?: SortKey;
  limit?: number;
  offset?: number;
};

/** Common spellings people type for product names (Cyrillic and Uzbek). */
const SYNONYMS: Record<string, string[]> = {
  айфон: ["iphone"],
  ayfon: ["iphone"],
  макбук: ["macbook"],
  makbuk: ["macbook"],
  аймак: ["imac"],
  aymak: ["imac"],
  айпад: ["ipad"],
  aypad: ["ipad"],
  эпл: ["apple"],
  эппл: ["apple"],
  epl: ["apple"],
  аирподс: ["airpods"],
  эйрподс: ["airpods"],
  airpods: ["airpods"],
  часы: ["watch"],
  soat: ["watch"],
  наушники: ["airpods", "quloqchin", "наушники"],
  quloqchin: ["airpods", "наушники", "quloqchin"],
  ноутбук: ["macbook", "noutbuk"],
  noutbuk: ["macbook", "ноутбук"],
  телефон: ["iphone", "telefon"],
  telefon: ["iphone", "телефон"],
  микрофон: ["mikrofon", "микрофон", "mic"],
  mikrofon: ["mikrofon", "микрофон", "mic"],
  камера: ["kamera", "камера", "camera"],
  kamera: ["kamera", "камера", "camera"],
  монитор: ["monitor", "display"],
  monitor: ["monitor", "монитор", "display"],
  компьютер: ["kompyuter", "pc", "компьютер"],
  kompyuter: ["kompyuter", "pc", "компьютер"],
};

function searchTerms(q: string): string[][] {
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((word) => {
      const variants = new Set(searchNormalize(word).split(" "));
      for (const v of [...variants]) for (const s of SYNONYMS[v] ?? []) variants.add(s);
      return [...variants].map((v) => v.replace(/[\\%_]/g, (m) => `\\${m}`));
    });
}

function buildWhere(q: ProductQuery) {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  const list = (name: string, values: unknown[]) => {
    values.forEach((v, i) => (params[`${name}${i}`] = v));
    return values.map((_, i) => `@${name}${i}`).join(", ");
  };
  if (q.status) {
    where.push("p.status = @status");
    params.status = q.status;
  } else if (!q.includeDrafts) {
    where.push("p.status = 'published'");
  }
  if (q.categoryIds?.length) where.push(`p.category_id IN (${list("c", q.categoryIds)})`);
  if (q.brandIds?.length) where.push(`p.brand_id IN (${list("b", q.brandIds)})`);
  if (q.ids) where.push(q.ids.length ? `p.id IN (${list("i", q.ids)})` : "0");
  if (q.excludeIds?.length) where.push(`p.id NOT IN (${list("x", q.excludeIds)})`);
  if (q.conditions?.length) where.push(`p.condition IN (${list("cd", q.conditions)})`);
  if (q.minPrice !== undefined) {
    where.push("p.max_price >= @minPrice");
    params.minPrice = q.minPrice;
  }
  if (q.maxPrice !== undefined) {
    where.push("p.min_price > 0 AND p.min_price <= @maxPrice");
    params.maxPrice = q.maxPrice;
  }
  if (q.inStock) where.push("p.in_stock = 1");
  if (q.onSale) where.push("p.discount_pct > 0");
  if (q.isNew) where.push("p.is_new = 1");
  if (q.isHit) where.push("p.is_hit = 1");
  if (q.isFeatured) where.push("p.is_featured = 1");
  if (q.stock) {
    where.push("p.stock = @stock");
    params.stock = q.stock;
  }
  if (q.q?.trim()) {
    searchTerms(q.q).forEach((alternatives, i) => {
      const ors = alternatives.map((alt, j) => {
        params[`w${i}_${j}`] = `%${alt}%`;
        return `p.search_text LIKE @w${i}_${j} ESCAPE '\\'`;
      });
      where.push(`(${ors.join(" OR ")})`);
    });
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

const ORDER: Record<SortKey, string> = {
  popular: "p.in_stock DESC, p.sort ASC, p.is_hit DESC, p.views DESC, p.id DESC",
  new: "p.created_at DESC, p.id DESC",
  price_asc: "(p.min_price = 0) ASC, p.min_price ASC, p.id DESC",
  price_desc: "p.min_price DESC, p.id DESC",
  discount: "p.discount_pct DESC, p.min_price ASC, p.id DESC",
};

export function queryProducts(q: ProductQuery = {}): { items: Product[]; total: number } {
  const db = getDb();
  const { sql, params } = buildWhere(q);
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM products p ${sql}`).get(params) as { n: number }).n;
  const limit = Math.min(Math.max(q.limit ?? 24, 1), 500);
  const offset = Math.max(q.offset ?? 0, 0);
  const rows = db
    .prepare(
      `SELECT p.* FROM products p ${sql} ORDER BY ${ORDER[q.sort ?? "popular"]} LIMIT ${limit} OFFSET ${offset}`,
    )
    .all(params) as ProductRow[];
  return { items: rows.map(mapProduct), total };
}

/** Cheapest/most expensive price in the current filter scope (base currency). */
export function priceBounds(q: ProductQuery): { min: number; max: number } {
  const { sql, params } = buildWhere({ ...q, minPrice: undefined, maxPrice: undefined });
  const row = getDb()
    .prepare(
      `SELECT MIN(CASE WHEN p.min_price > 0 THEN p.min_price END) AS min, MAX(p.max_price) AS max FROM products p ${sql}`,
    )
    .get(params) as { min: number | null; max: number | null };
  return { min: row.min ?? 0, max: row.max ?? 0 };
}

export function brandFacets(q: ProductQuery): { id: number; name: string; count: number }[] {
  const { sql, params } = buildWhere({ ...q, brandIds: undefined });
  return getDb()
    .prepare(
      `SELECT b.id, b.name, COUNT(*) AS count FROM products p JOIN brands b ON b.id = p.brand_id ${sql}
       GROUP BY b.id ORDER BY b.sort, b.name`,
    )
    .all(params) as { id: number; name: string; count: number }[];
}

export function conditionFacets(q: ProductQuery): { condition: Condition; count: number }[] {
  const { sql, params } = buildWhere({ ...q, conditions: undefined });
  return getDb()
    .prepare(`SELECT p.condition, COUNT(*) AS count FROM products p ${sql} GROUP BY p.condition`)
    .all(params) as { condition: Condition; count: number }[];
}

export function getProductBySlug(slug: string, includeDrafts = false): Product | null {
  const row = getDb()
    .prepare(`SELECT * FROM products WHERE slug = ? ${includeDrafts ? "" : "AND status = 'published'"}`)
    .get(slug) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function getProductById(id: number): Product | null {
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function bumpViews(id: number): void {
  getDb().prepare("UPDATE products SET views = views + 1 WHERE id = ?").run(id);
}

export type ProductInput = {
  slug: string;
  categoryId: number | null;
  brandId: number | null;
  sku: string;
  name: Localized;
  tagline: Localized;
  description: Localized;
  warranty: Localized;
  condition: Condition;
  price: number;
  oldPrice: number | null;
  stock: StockStatus;
  images: ImageAsset[];
  options: ProductOption[];
  variants: ProductVariant[];
  specs: SpecGroup[];
  isNew: boolean;
  isHit: boolean;
  isFeatured: boolean;
  status: ProductStatus;
  sort: number;
};

function buildSearchText(input: ProductInput): string {
  const db = getDb();
  const brand = input.brandId
    ? ((db.prepare("SELECT name FROM brands WHERE id = ?").get(input.brandId) as { name: string } | undefined)
        ?.name ?? "")
    : "";
  const category = input.categoryId
    ? (db.prepare("SELECT name_uz, name_ru FROM categories WHERE id = ?").get(input.categoryId) as
        | { name_uz: string; name_ru: string }
        | undefined)
    : undefined;
  const optionLabels = input.options.flatMap((o) => o.values.flatMap((v) => [v.label.uz, v.label.ru]));
  return searchNormalize(
    [
      input.name.uz,
      input.name.ru,
      input.tagline.uz,
      input.tagline.ru,
      brand,
      input.sku,
      category?.name_uz ?? "",
      category?.name_ru ?? "",
      ...optionLabels,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function uniqueProductSlug(base: string, excludeId?: number): string {
  const db = getDb();
  const root = slugify(base) || "mahsulot";
  let candidate = root;
  for (let n = 2; db.prepare("SELECT 1 FROM products WHERE slug = ? AND id != ?").get(candidate, excludeId ?? 0); n++) {
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export function saveProduct(input: ProductInput, id?: number, opts: { isDemo?: boolean } = {}): number {
  const db = getDb();
  const derived = deriveProduct(input);
  const params = {
    slug: input.slug,
    category_id: input.categoryId,
    brand_id: input.brandId,
    sku: input.sku,
    name_uz: input.name.uz,
    name_ru: input.name.ru,
    tagline_uz: input.tagline.uz,
    tagline_ru: input.tagline.ru,
    description_uz: input.description.uz,
    description_ru: input.description.ru,
    warranty_uz: input.warranty.uz,
    warranty_ru: input.warranty.ru,
    condition: input.condition,
    price: input.price,
    old_price: input.oldPrice,
    stock: input.stock,
    images: JSON.stringify(input.images),
    options: JSON.stringify(input.options),
    variants: JSON.stringify(input.options.length ? input.variants : []),
    specs: JSON.stringify(input.specs),
    is_new: input.isNew ? 1 : 0,
    is_hit: input.isHit ? 1 : 0,
    is_featured: input.isFeatured ? 1 : 0,
    status: input.status,
    sort: input.sort,
    min_price: derived.minPrice,
    max_price: derived.maxPrice,
    min_old_price: derived.minOldPrice,
    discount_pct: derived.discountPct,
    in_stock: derived.inStock ? 1 : 0,
    search_text: buildSearchText(input),
  };
  const columns = Object.keys(params);
  if (id) {
    db.prepare(
      `UPDATE products SET ${columns.map((c) => `${c} = @${c}`).join(", ")}, updated_at = datetime('now') WHERE id = @id`,
    ).run({ ...params, id });
    return id;
  }
  const res = db
    .prepare(
      `INSERT INTO products (${columns.join(", ")}, is_demo) VALUES (${columns.map((c) => `@${c}`).join(", ")}, @is_demo)`,
    )
    .run({ ...params, is_demo: opts.isDemo ? 1 : 0 });
  return Number(res.lastInsertRowid);
}

export function productToInput(p: Product): ProductInput {
  return {
    slug: p.slug,
    categoryId: p.categoryId,
    brandId: p.brandId,
    sku: p.sku,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    warranty: p.warranty,
    condition: p.condition,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.stock,
    images: p.images,
    options: p.options,
    variants: p.variants,
    specs: p.specs,
    isNew: p.isNew,
    isHit: p.isHit,
    isFeatured: p.isFeatured,
    status: p.status,
    sort: p.sort,
  };
}

export function deleteProduct(id: number): Product | null {
  const existing = getProductById(id);
  if (existing) getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
  return existing;
}

type FlagField = "status" | "is_new" | "is_hit" | "is_featured";

export function setProductFlag(id: number, field: FlagField, value: string | number): void {
  getDb()
    .prepare(`UPDATE products SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(value, id);
}

/** Recompute derived columns, e.g. after brand or category renames. */
export function reindexProducts(): void {
  const rows = getDb().prepare("SELECT * FROM products").all() as ProductRow[];
  const tx = getDb().transaction(() => {
    for (const row of rows) {
      const p = mapProduct(row);
      saveProduct(productToInput(p), p.id);
    }
  });
  tx();
}

export function productStats() {
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS total,
        SUM(status = 'published') AS published,
        SUM(status = 'draft') AS drafts,
        SUM(discount_pct > 0) AS onSale,
        SUM(in_stock = 0) AS outOfStock,
        SUM(is_demo = 1) AS demo
       FROM products`,
    )
    .get() as {
    total: number;
    published: number | null;
    drafts: number | null;
    onSale: number | null;
    outOfStock: number | null;
    demo: number | null;
  };
}

/** Every image asset still referenced anywhere (used for orphan cleanup). */
export function referencedImageIds(): Set<string> {
  const db = getDb();
  const ids = new Set<string>();
  const add = (json: string | null) => {
    const parsed = parseJson<ImageAsset | ImageAsset[] | null>(json, null);
    for (const a of Array.isArray(parsed) ? parsed : parsed ? [parsed] : []) ids.add(a.id);
  };
  for (const r of db.prepare("SELECT images FROM products").all() as { images: string }[]) add(r.images);
  for (const r of db.prepare("SELECT image FROM categories").all() as { image: string | null }[]) add(r.image);
  for (const r of db.prepare("SELECT logo FROM brands").all() as { logo: string | null }[]) add(r.logo);
  for (const r of db.prepare("SELECT image, image_mobile FROM banners").all() as {
    image: string | null;
    image_mobile: string | null;
  }[]) {
    add(r.image);
    add(r.image_mobile);
  }
  return ids;
}
