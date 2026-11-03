import "server-only";
import { buildTree, listCategories } from "../repo/categories";
import { listBrands } from "../repo/brands";

/** Category <select> options in tree order ("Apple", "— iPhone", …). */
export function categoryOptions(): { id: number; label: string }[] {
  return buildTree(listCategories()).flatMap((root) => [
    { id: root.id, label: root.name.uz },
    ...root.children.map((c) => ({ id: c.id, label: `— ${c.name.uz}` })),
  ]);
}

export function brandOptions(): { id: number; name: string }[] {
  return listBrands().map((b) => ({ id: b.id, name: b.name }));
}
