import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "./db";
import { assetFiles } from "./asset-url";
import type { ImageAsset } from "./types";

const WIDTHS = [320, 640, 1080, 1600];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function newAssetId(): string {
  return `${Date.now().toString(36)}${crypto.randomBytes(5).toString("hex")}`;
}

/** Normalize an uploaded photo into WebP renditions for responsive `srcset`. */
export async function processImage(input: Buffer, opts: { maxWidth?: number } = {}): Promise<ImageAsset> {
  const maxWidth = Math.min(opts.maxWidth ?? 1600, 2400);
  const base = await sharp(input, { failOn: "error", limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = base.info;
  const sizes = [...WIDTHS.filter((w) => w < width), width];
  const id = newAssetId();
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await Promise.all(
    sizes.map((w) =>
      sharp(base.data)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4, smartSubsample: true })
        .toFile(path.join(UPLOAD_DIR, `${id}-${w}.webp`)),
    ),
  );
  return { id, w: width, h: height, sizes, ext: "webp", color: null };
}

/** Copy an asset's files under a new id (used when duplicating a product). */
export async function duplicateAsset(asset: ImageAsset): Promise<ImageAsset> {
  const id = newAssetId();
  const pairs =
    asset.ext === "svg"
      ? [[`${asset.id}.svg`, `${id}.svg`]]
      : asset.sizes.map((s) => [`${asset.id}-${s}.webp`, `${id}-${s}.webp`]);
  await Promise.all(
    pairs.map(([from, to]) => fs.copyFile(path.join(UPLOAD_DIR, from), path.join(UPLOAD_DIR, to)).catch(() => undefined)),
  );
  return { ...asset, id };
}

export async function deleteAssets(assets: Array<ImageAsset | null | undefined>): Promise<void> {
  const files = assets.filter((a): a is ImageAsset => Boolean(a)).flatMap(assetFiles);
  await Promise.all(files.map((f) => fs.rm(path.join(UPLOAD_DIR, f), { force: true })));
}

/** Remove images that were replaced or dropped while editing a record. */
export async function deleteRemovedAssets(
  before: Array<ImageAsset | null | undefined>,
  after: Array<ImageAsset | null | undefined>,
): Promise<void> {
  const keep = new Set(after.filter(Boolean).map((a) => a!.id));
  await deleteAssets(before.filter((a) => a && !keep.has(a.id)));
}

/** Delete files in the upload folder that no record references any more. */
export async function cleanupOrphans(referenced: Set<string>, olderThanMs = 6 * 60 * 60 * 1000) {
  const names = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
  const now = Date.now();
  let removed = 0;
  for (const name of names) {
    const id = name.replace(/(-\d+)?\.(webp|svg)$/, "");
    if (referenced.has(id)) continue;
    const full = path.join(UPLOAD_DIR, name);
    const stat = await fs.stat(full).catch(() => null);
    // Fresh uploads may belong to a form that has not been saved yet.
    if (!stat || now - stat.mtimeMs < olderThanMs) continue;
    await fs.rm(full, { force: true });
    removed++;
  }
  return removed;
}
