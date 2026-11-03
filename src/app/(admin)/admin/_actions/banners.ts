"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bannerInput, issuesToErrors } from "@/lib/admin/schemas";
import { deleteAssets, deleteRemovedAssets } from "@/lib/images";
import { deleteBanner, getBanner, listBanners, saveBanner, setBannerActive, type BannerInput } from "@/lib/repo/banners";
import type { FormResult } from "./catalog";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveBannerAction(id: number | null, raw: BannerInput): Promise<FormResult> {
  await requireAdmin();
  const parsed = bannerInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: issuesToErrors(parsed.error.issues), message: "Maydonlarni tekshiring" };
  const input = parsed.data as BannerInput;
  if (!input.image) return { ok: false, errors: { image: "Banner rasmini yuklang" }, message: "Banner rasmini yuklang" };
  if (!id) input.sort = listBanners().reduce((m, b) => Math.max(m, b.sort), 0) + 10;
  const before = id ? getBanner(id) : null;
  const savedId = saveBanner(input, id ?? undefined);
  if (before) await deleteRemovedAssets([before.image, before.imageMobile], [input.image, input.imageMobile]);
  refresh();
  return { ok: true, id: savedId };
}

export async function deleteBannerAction(id: number): Promise<void> {
  await requireAdmin();
  const removed = deleteBanner(id);
  if (removed) await deleteAssets([removed.image, removed.imageMobile]);
  refresh();
}

export async function toggleBannerAction(id: number, active: boolean): Promise<void> {
  await requireAdmin();
  setBannerActive(id, active);
  refresh();
}

export async function moveBannerAction(id: number, dir: -1 | 1): Promise<void> {
  await requireAdmin();
  const list = listBanners();
  const index = list.findIndex((b) => b.id === id);
  const other = list[index + dir];
  if (index < 0 || !other) return;
  const reordered = [...list];
  [reordered[index], reordered[index + dir]] = [reordered[index + dir], reordered[index]];
  reordered.forEach((b, i) => {
    saveBanner(
      {
        title: b.title,
        subtitle: b.subtitle,
        button: b.button,
        link: b.link,
        image: b.image,
        imageMobile: b.imageMobile,
        theme: b.theme,
        bg: b.bg,
        accent: b.accent,
        sort: i * 10,
        isActive: b.isActive,
      },
      b.id,
    );
  });
  refresh();
}
