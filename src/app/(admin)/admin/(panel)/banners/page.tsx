import type { Metadata } from "next";
import { BannersManager } from "@/components/admin/banners-manager";
import { PageHeader } from "@/components/admin/ui";
import { listBanners } from "@/lib/repo/banners";

export const metadata: Metadata = { title: "Bannerlar" };

export default function BannersPage() {
  return (
    <div>
      <PageHeader title="Bannerlar" subtitle="Bosh sahifadagi slayder. Tartibini ↑ ↓ bilan oʻzgartiring." />
      <BannersManager banners={listBanners()} />
    </div>
  );
}
