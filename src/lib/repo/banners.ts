import "server-only";
import { getDb, parseJson } from "../db";
import type { Banner, ImageAsset, Localized } from "../types";

type BannerRow = {
  id: number;
  title_uz: string;
  title_ru: string;
  subtitle_uz: string;
  subtitle_ru: string;
  button_uz: string;
  button_ru: string;
  link: string;
  image: string | null;
  image_mobile: string | null;
  theme: "light" | "dark";
  bg: string;
  accent: string;
  sort: number;
  is_active: number;
  is_demo: number;
};

function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: { uz: row.title_uz, ru: row.title_ru },
    subtitle: { uz: row.subtitle_uz, ru: row.subtitle_ru },
    button: { uz: row.button_uz, ru: row.button_ru },
    link: row.link,
    image: parseJson<ImageAsset | null>(row.image, null),
    imageMobile: parseJson<ImageAsset | null>(row.image_mobile, null),
    theme: row.theme === "dark" ? "dark" : "light",
    bg: row.bg,
    accent: row.accent ?? "",
    sort: row.sort,
    isActive: row.is_active === 1,
    isDemo: row.is_demo === 1,
  };
}

export function listBanners(opts: { activeOnly?: boolean } = {}): Banner[] {
  const rows = getDb()
    .prepare(`SELECT * FROM banners ${opts.activeOnly ? "WHERE is_active = 1" : ""} ORDER BY sort, id`)
    .all() as BannerRow[];
  return rows.map(mapBanner);
}

export function getBanner(id: number): Banner | null {
  const row = getDb().prepare("SELECT * FROM banners WHERE id = ?").get(id) as BannerRow | undefined;
  return row ? mapBanner(row) : null;
}

export type BannerInput = {
  title: Localized;
  subtitle: Localized;
  button: Localized;
  link: string;
  image: ImageAsset | null;
  imageMobile: ImageAsset | null;
  theme: "light" | "dark";
  bg: string;
  accent: string;
  sort: number;
  isActive: boolean;
};

export function saveBanner(input: BannerInput, id?: number, opts: { isDemo?: boolean } = {}): number {
  const db = getDb();
  const params = {
    title_uz: input.title.uz,
    title_ru: input.title.ru,
    subtitle_uz: input.subtitle.uz,
    subtitle_ru: input.subtitle.ru,
    button_uz: input.button.uz,
    button_ru: input.button.ru,
    link: input.link,
    image: input.image ? JSON.stringify(input.image) : null,
    image_mobile: input.imageMobile ? JSON.stringify(input.imageMobile) : null,
    theme: input.theme,
    bg: input.bg,
    accent: input.accent,
    sort: input.sort,
    is_active: input.isActive ? 1 : 0,
  };
  const columns = Object.keys(params);
  if (id) {
    db.prepare(`UPDATE banners SET ${columns.map((c) => `${c} = @${c}`).join(", ")} WHERE id = @id`).run({
      ...params,
      id,
    });
    return id;
  }
  const res = db
    .prepare(
      `INSERT INTO banners (${columns.join(", ")}, is_demo) VALUES (${columns.map((c) => `@${c}`).join(", ")}, @is_demo)`,
    )
    .run({ ...params, is_demo: opts.isDemo ? 1 : 0 });
  return Number(res.lastInsertRowid);
}

export function deleteBanner(id: number): Banner | null {
  const existing = getBanner(id);
  if (existing) getDb().prepare("DELETE FROM banners WHERE id = ?").run(id);
  return existing;
}

export function setBannerActive(id: number, active: boolean): void {
  getDb().prepare("UPDATE banners SET is_active = ? WHERE id = ?").run(active ? 1 : 0, id);
}
