/* eslint-disable @next/next/no-img-element -- uploads are pre-sized WebP renditions served with their own srcset */
import { assetSrc, assetSrcSet } from "@/lib/asset-url";
import type { ImageAsset } from "@/lib/types";

type Props = {
  asset: ImageAsset;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Preferred rendition width for the fallback `src`. */
  width?: number;
};

export function Img({ asset, alt, sizes = "100vw", className, priority = false, width = 1080 }: Props) {
  return (
    <img
      src={assetSrc(asset, width)}
      srcSet={assetSrcSet(asset)}
      sizes={assetSrcSet(asset) ? sizes : undefined}
      width={asset.w}
      height={asset.h}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      draggable={false}
      className={className}
    />
  );
}
