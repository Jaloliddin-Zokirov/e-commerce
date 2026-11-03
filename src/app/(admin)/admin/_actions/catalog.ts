"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { categoryInput, issuesToErrors } from "@/lib/admin/schemas";
import { deleteAssets, deleteRemovedAssets } from "@/lib/images";
import { brandSlugTaken, deleteBrand, getBrand, saveBrand } from "@/lib/repo/brands";
import {
  deleteCategory,
  getCategory,
  listCategories,
  nextCategorySort,
  saveCategory,
  slugTaken,
  type CategoryInput,
} from "@/lib/repo/categories";
import { reindexProducts } from "@/lib/repo/products";
import { slugify } from "@/lib/slug";
import type { ImageAsset } from "@/lib/types";

export type FormResult = { ok: true; id: number } | { ok: false; errors: Record<string, string>; message: string };

function refresh() {
  revalidatePath("/", "layout");
}

function uniqueSlug(base: string, taken: (s: string) => boolean): string {
  const root = slugify(base) || "item";
  let slug = root;
  for (let n = 2; taken(slug); n++) slug = `${root}-${n}`;
  return slug;
}

export async function saveCategoryAction(id: number | null, raw: CategoryInput): Promise<FormResult> {
  await requireAdmin();
  const parsed = categoryInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues), message: "Maydonlarni tekshiring" };
  const input = parsed.data as CategoryInput;
  if (!input.name.uz) return { ok: false, errors: { "name.uz": "Nomini kiriting" }, message: "Nomini kiriting" };
  if (id && input.parentId === id) input.parentId = null;
  // A category cannot become a child of its own child (keeps the tree two levels deep).
  if (id && input.parentId) {
    const parent = getCategory(input.parentId);
    if (parent?.parentId === id) input.parentId = null;
  }
  input.slug = uniqueSlug(input.slug || input.name.uz, (s) => slugTaken(s, id ?? undefined));
  if (!id) input.sort = nextCategorySort(input.parentId);
  const before = id ? getCategory(id) : null;
  const savedId = saveCategory(input, id ?? undefined);
  if (before) await deleteRemovedAssets([before.image], [input.image]);
  if (before && (before.name.uz !== input.name.uz || before.name.ru !== input.name.ru)) reindexProducts();
  refresh();
  return { ok: true, id: savedId };
}

export async function deleteCategoryAction(id: number): Promise<void> {
  await requireAdmin();
  const removed = deleteCategory(id);
  if (removed) await deleteAssets([removed.image]);
  refresh();
}

/** Swap sort order with the neighbour in the same level. */
export async function moveCategoryAction(id: number, dir: -1 | 1): Promise<void> {
  await requireAdmin();
  const all = listCategories();
  const current = all.find((c) => c.id === id);
  if (!current) return;
  const siblings = all.filter((c) => c.parentId === current.parentId);
  const index = siblings.findIndex((c) => c.id === id);
  const other = siblings[index + dir];
  if (!other) return;
  siblings.forEach((c, i) => (c.sort = i * 10));
  [current.sort, other.sort] = [other.sort, current.sort];
  for (const c of [current, other, ...siblings.filter((s) => s !== current && s !== other)]) {
    saveCategory(
      { parentId: c.parentId, slug: c.slug, name: c.name, subtitle: c.subtitle, image: c.image, sort: c.sort, isActive: c.isActive, inMenu: c.inMenu },
      c.id,
    );
  }
  refresh();
}

export async function toggleCategoryAction(id: number, field: "isActive" | "inMenu", value: boolean): Promise<void> {
  await requireAdmin();
  const c = getCategory(id);
  if (!c) return;
  saveCategory(
    { parentId: c.parentId, slug: c.slug, name: c.name, subtitle: c.subtitle, image: c.image, sort: c.sort, isActive: c.isActive, inMenu: c.inMenu, [field]: value },
    id,
  );
  refresh();
}

export async function saveBrandAction(
  id: number | null,
  raw: { name: string; slug: string; logo: ImageAsset | null; sort: number },
): Promise<FormResult> {
  await requireAdmin();
  const name = String(raw.name ?? "").trim().slice(0, 80);
  if (!name) return { ok: false, errors: { name: "Brend nomini kiriting" }, message: "Brend nomini kiriting" };
  const slug = uniqueSlug(String(raw.slug ?? "") || name, (s) => brandSlugTaken(s, id ?? undefined));
  const before = id ? getBrand(id) : null;
  const savedId = saveBrand({ name, slug, logo: raw.logo ?? null, sort: Number(raw.sort) || 0 }, id ?? undefined);
  if (before) await deleteRemovedAssets([before.logo], [raw.logo]);
  if (before && before.name !== name) reindexProducts();
  refresh();
  return { ok: true, id: savedId };
}

export async function deleteBrandAction(id: number): Promise<void> {
  await requireAdmin();
  const removed = deleteBrand(id);
  if (removed) await deleteAssets([removed.logo]);
  refresh();
}
