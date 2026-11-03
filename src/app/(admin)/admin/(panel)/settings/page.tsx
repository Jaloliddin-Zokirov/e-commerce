import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { productStats } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";

export const metadata: Metadata = { title: "Sozlamalar" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Sozlamalar" subtitle="Aloqa, manzil, valyuta va boshqa umumiy maʼlumotlar" />
      <SettingsForm initial={getSettings()} demoCount={productStats().demo ?? 0} />
    </div>
  );
}
