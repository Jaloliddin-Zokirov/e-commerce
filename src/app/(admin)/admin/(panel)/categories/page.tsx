import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { buildTree, listCategories } from "@/lib/repo/categories";

export const metadata: Metadata = { title: "Kategoriyalar" };

export default function CategoriesPage() {
  const categories = listCategories();
  const rows = getDb()
    .prepare("SELECT category_id AS id, COUNT(*) AS n FROM products WHERE category_id IS NOT NULL GROUP BY category_id")
    .all() as { id: number; n: number }[];
  return (
    <div>
      <PageHeader
        title="Kategoriyalar"
        subtitle="Ikki darajali tuzilma: masalan, Apple → iPhone, Mac, iPad. «Menyuda» belgilanganlari sarlavha ostida chiqadi."
      />
      <CategoriesManager tree={buildTree(categories)} counts={Object.fromEntries(rows.map((r) => [r.id, r.n]))} />
    </div>
  );
}
