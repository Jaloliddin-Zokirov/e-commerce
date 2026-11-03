import type { ReactNode } from "react";
import { LiveLeadsProvider } from "@/components/admin/live-leads";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth";
import { countNewLeads } from "@/lib/repo/leads";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <LiveLeadsProvider initialNew={countNewLeads()}>
      <AdminShell>{children}</AdminShell>
    </LiveLeadsProvider>
  );
}
