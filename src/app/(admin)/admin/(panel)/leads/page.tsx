import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { LeadsTable } from "@/components/admin/leads-table";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { countNewLeads, listLeads } from "@/lib/repo/leads";
import { getSettings } from "@/lib/repo/settings";

export const metadata: Metadata = { title: "Soʻrovlar" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const showAll = all === "1";
  const { items, total } = listLeads({ status: showAll ? undefined : "new", limit: 200 });
  const newCount = countNewLeads();
  const bot = getSettings().telegramBot;
  return (
    <div>
      <PageHeader
        title="Soʻrovlar"
        subtitle="Saytdagi «Buyurtma berish» va «Qayta qoʻngʻiroq» formalari orqali kelgan murojaatlar"
        actions={
          <div className="flex gap-1.5">
            <Link href="/admin/leads" className="chip min-h-9" data-active={!showAll}>
              Yangi ({newCount})
            </Link>
            <Link href="/admin/leads?all=1" className="chip min-h-9" data-active={showAll}>
              Hammasi
            </Link>
          </div>
        }
      />
      {!bot.token && (
        <div className="mb-4 rounded-[20px] bg-accent-soft px-5 py-4 text-[13.5px] leading-relaxed text-accent">
          Maslahat: yangi soʻrovlar darhol Telegramga kelishi uchun <b>Sozlamalar → Telegram bildirishnomalar</b> boʻlimida bot ulang.
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={showAll ? "Soʻrovlar yoʻq" : "Yangi soʻrov yoʻq"}
          text="Mijoz saytda telefon raqamini qoldirsa, soʻrov shu yerda paydo boʻladi."
        />
      ) : (
        <>
          <LeadsTable
            rows={items.map((l) => ({
              id: l.id,
              kind: l.kind,
              name: l.name,
              phone: l.phone,
              message: l.message,
              productName: l.productName,
              variant: l.variant,
              pageUrl: l.pageUrl,
              locale: l.locale,
              done: l.status === "done",
              date: formatDateTime(l.createdAt),
            }))}
          />
          {total > items.length && <p className="mt-4 text-center text-[13px] text-muted">Oxirgi {items.length} ta koʻrsatildi</p>}
        </>
      )}
    </div>
  );
}
