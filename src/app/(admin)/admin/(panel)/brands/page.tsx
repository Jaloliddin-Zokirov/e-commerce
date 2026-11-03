import type { Metadata } from "next";
import { BrandsManager } from "@/components/admin/brands-manager";
import { PageHeader } from "@/components/admin/ui";
import { brandProductCounts, listBrands } from "@/lib/repo/brands";

export const metadata: Metadata = { title: "Brendlar" };

export default function BrandsPage() {
  return (
    <div>
      <PageHeader title="Brendlar" subtitle="Katalogdagi «Brend» filtri shu roʻyxatdan tuziladi." />
      <BrandsManager brands={listBrands()} counts={Object.fromEntries(brandProductCounts())} />
    </div>
  );
}
