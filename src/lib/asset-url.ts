import type { ImageAsset } from "./types";

export function assetSrc(asset: ImageAsset, width?: number): string {
  if (asset.ext === "svg" || asset.sizes.length === 0) return `/uploads/${asset.id}.${asset.ext}`;
  const target = width ?? asset.sizes[asset.sizes.length - 1];
  const size = asset.sizes.find((s) => s >= target) ?? asset.sizes[asset.sizes.length - 1];
  return `/uploads/${asset.id}-${size}.webp`;
}

export function assetSrcSet(asset: ImageAsset): string | undefined {
  if (asset.ext === "svg" || asset.sizes.length < 2) return undefined;
  return asset.sizes.map((s) => `/uploads/${asset.id}-${s}.webp ${s}w`).join(", ");
}

/** Every file name that belongs to an asset (for deletion). */
export function assetFiles(asset: ImageAsset): string[] {
  if (asset.ext === "svg") return [`${asset.id}.svg`];
  return asset.sizes.map((s) => `${asset.id}-${s}.webp`);
}
