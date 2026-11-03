import type { ImageAsset } from "@/lib/types";

export type MenuItem = { id: number; name: string; href: string; image: ImageAsset | null };
export type MenuCategory = MenuItem & { children: MenuItem[] };
