import "server-only";
import { getDb, parseJson } from "../db";
import type { Brand, ImageAsset } from "../types";

type BrandRow = { id: number; slug: string; name: string; logo: string | null; sort: number };

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: parseJson<ImageAsset | null>(row.logo, null),
    sort: row.sort,
  };
}

export function listBrands(): Brand[] {
  return (getDb().prepare("SELECT * FROM brands ORDER BY sort, name").all() as BrandRow[]).map(
    mapBrand,
  );
}

export function getBrand(id: number): Brand | null {
  const row = getDb().prepare("SELECT * FROM brands WHERE id = ?").get(id) as BrandRow | undefined;
  return row ? mapBrand(row) : null;
}

export function brandProductCounts(): Map<number, number> {
  const rows = getDb()
    .prepare("SELECT brand_id AS id, COUNT(*) AS n FROM products WHERE brand_id IS NOT NULL GROUP BY brand_id")
    .all() as { id: number; n: number }[];
  return new Map(rows.map((r) => [r.id, r.n]));
}

export function saveBrand(
  input: { slug: string; name: string; logo: ImageAsset | null; sort: number },
  id?: number,
): number {
  const db = getDb();
  const params = {
    slug: input.slug,
    name: input.name,
    logo: input.logo ? JSON.stringify(input.logo) : null,
    sort: input.sort,
  };
  if (id) {
    db.prepare("UPDATE brands SET slug=@slug, name=@name, logo=@logo, sort=@sort WHERE id=@id").run({
      ...params,
      id,
    });
    return id;
  }
  const res = db
    .prepare("INSERT INTO brands (slug, name, logo, sort) VALUES (@slug, @name, @logo, @sort)")
    .run(params);
  return Number(res.lastInsertRowid);
}

export function deleteBrand(id: number): Brand | null {
  const existing = getBrand(id);
  if (existing) getDb().prepare("DELETE FROM brands WHERE id = ?").run(id);
  return existing;
}

export function brandSlugTaken(slug: string, excludeId?: number): boolean {
  return Boolean(
    getDb().prepare("SELECT id FROM brands WHERE slug = ? AND id != ?").get(slug, excludeId ?? 0),
  );
}
