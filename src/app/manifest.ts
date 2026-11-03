import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/repo/settings";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  const settings = getSettings();
  return {
    name: `${settings.storeName} — ${settings.tagline.uz}`,
    short_name: settings.storeName,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
