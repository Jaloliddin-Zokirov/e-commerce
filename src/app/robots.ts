import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*/search", "/*/favorites"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
