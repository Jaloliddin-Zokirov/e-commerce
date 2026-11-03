"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { issuesToErrors, productInput } from "@/lib/admin/schemas";
import { deleteAssets, deleteRemovedAssets, duplicateAsset } from "@/lib/images";
import { variantLabel } from "@/lib/product-utils";
import {
  deleteProduct,
  getProductById,
  productToInput,
  saveProduct,
  setProductFlag,
  uniqueProductSlug,
  type ProductInput,
} from "@/lib/repo/products";
import { slugify } from "@/lib/slug";

export type SaveResult =
  | { ok: true; id: number; slug: string }
  | { ok: false; errors: Record<string, string>; message: string };

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveProductAction(id: number | null, raw: ProductInput): Promise<SaveResult> {
  await requireAdmin();
  const parsed = productInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: issuesToErrors(parsed.error.issues), message: "Maydonlarni tekshiring" };
  }
  const input = parsed.data as ProductInput;
  const errors: Record<string, string> = {};
  if (!input.name.uz) errors["name.uz"] = "Mahsulot nomini kiriting";

  const hasVariants = input.options.some((o) => o.values.length > 0);
  if (hasVariants) {
    input.options = input.options.filter((o) => o.values.length > 0);
    for (const o of input.options) {
      if (!o.name.uz) errors[`options.${o.id}`] = "Variant nomini kiriting (masalan: Rang)";
      o.values.forEach((v) => {
        if (!v.label.uz) errors[`options.${o.id}`] = "Har bir qiymat uchun nom kiriting";
      });
    }
    const enabled = input.variants.filter((v) => v.enabled);
    if (enabled.length === 0) errors.variants = "Kamida bitta variant faol boʻlishi kerak";
    for (const v of enabled) {
      if (v.oldPrice !== null && v.oldPrice > 0 && v.oldPrice <= v.price) {
        errors.variants = `«${variantLabel(input.options, v, "uz")}»: eski narx yangi narxdan katta boʻlishi kerak`;
      }
    }
  } else {
    input.options = [];
    input.variants = [];
    if (input.oldPrice !== null && input.oldPrice > 0 && input.oldPrice <= input.price) {
      errors.oldPrice = "Eski (chizilgan) narx joriy narxdan katta boʻlishi kerak";
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors, message: Object.values(errors)[0] };

  // Normalize: empty old prices become null, unknown image color tags are dropped.
  if (input.oldPrice !== null && input.oldPrice <= 0) input.oldPrice = null;
  input.variants = input.variants.map((v) => ({ ...v, oldPrice: v.oldPrice && v.oldPrice > 0 ? v.oldPrice : null }));
  const colorIds = new Set(input.options.filter((o) => o.kind === "color").flatMap((o) => o.values.map((v) => v.id)));
  input.images = input.images.map((img) => ({ ...img, color: img.color && colorIds.has(img.color) ? img.color : null }));
  input.slug = uniqueProductSlug(slugify(input.slug) || input.name.uz, id ?? undefined);

  const before = id ? getProductById(id) : null;
  if (id && !before) return { ok: false, errors: {}, message: "Mahsulot topilmadi" };
  const savedId = saveProduct(input, id ?? undefined);
  if (before) await deleteRemovedAssets(before.images, input.images);
  refresh();
  return { ok: true, id: savedId, slug: input.slug };
}

export async function deleteProductAction(id: number): Promise<void> {
  await requireAdmin();
  const removed = deleteProduct(id);
  if (removed) await deleteAssets(removed.images);
  refresh();
}

export async function duplicateProductAction(id: number): Promise<{ id: number } | null> {
  await requireAdmin();
  const source = getProductById(id);
  if (!source) return null;
  const input = productToInput(source);
  input.images = await Promise.all(source.images.map(duplicateAsset));
  input.name = { uz: `${source.name.uz} (nusxa)`, ru: source.name.ru ? `${source.name.ru} (копия)` : "" };
  input.slug = uniqueProductSlug(`${source.slug}-nusxa`);
  input.status = "draft";
  const newId = saveProduct(input);
  refresh();
  return { id: newId };
}

export async function toggleProductAction(
  id: number,
  field: "status" | "isNew" | "isHit" | "isFeatured",
  value: boolean,
): Promise<void> {
  await requireAdmin();
  if (field === "status") setProductFlag(id, "status", value ? "published" : "draft");
  else setProductFlag(id, field === "isNew" ? "is_new" : field === "isHit" ? "is_hit" : "is_featured", value ? 1 : 0);
  refresh();
}

export async function bulkProductsAction(ids: number[], op: "publish" | "draft" | "delete"): Promise<void> {
  await requireAdmin();
  for (const id of ids.filter((n) => Number.isInteger(n))) {
    if (op === "delete") {
      const removed = deleteProduct(id);
      if (removed) await deleteAssets(removed.images);
    } else {
      setProductFlag(id, "status", op === "publish" ? "published" : "draft");
    }
  }
  refresh();
}

/** Specs of another product, for "copy specifications from…". */
export async function productSpecsAction(id: number) {
  await requireAdmin();
  return getProductById(id)?.specs ?? [];
}
