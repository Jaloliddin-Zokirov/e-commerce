"use client";

import { useRouter } from "next/navigation";
import { Phone, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteLeadAction, setLeadStatusAction } from "@/app/(admin)/admin/_actions/leads";
import { TelegramIcon } from "@/components/brand-icons";
import { cn } from "@/lib/utils";
import { ConfirmButton, StatusPill, useToast } from "./ui";

export type LeadRow = {
  id: number;
  kind: "order" | "callback";
  name: string;
  phone: string;
  message: string;
  productName: string;
  variant: string;
  pageUrl: string;
  locale: string;
  done: boolean;
  date: string;
};

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [done, setDone] = useState<Record<number, boolean>>({});
  // Leads that arrive live (after the page was opened) get a short highlight.
  const [initialIds] = useState(() => new Set(rows.map((r) => r.id)));

  return (
    <div className="space-y-3">
      {rows.map((l) => {
        const isDone = done[l.id] ?? l.done;
        const digits = l.phone.replace(/[^\d]/g, "");
        return (
          <div
            key={l.id}
            className={cn(
              "rounded-[20px] bg-white p-4 shadow-card sm:p-5",
              isDone && "opacity-70",
              !initialIds.has(l.id) && "animate-pop-in ring-2 ring-accent/40",
            )}
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {l.kind === "order" ? <StatusPill tone="accent">🛒 Buyurtma</StatusPill> : <StatusPill tone="muted">Qayta qoʻngʻiroq</StatusPill>}
                  <span className="text-[16px] font-semibold">{l.name || "Ism koʻrsatilmagan"}</span>
                  {isDone ? <StatusPill tone="ok">Bogʻlanildi</StatusPill> : <StatusPill tone="sale">Yangi</StatusPill>}
                  <span className="text-[12.5px] text-muted">{l.date}</span>
                  <span className="rounded bg-canvas px-1.5 text-[11px] font-bold uppercase text-muted">{l.locale}</span>
                </div>
                <a href={`tel:+${digits}`} className="mt-1 inline-flex items-center gap-1.5 text-[17px] font-semibold text-accent tabular">
                  <Phone className="size-4" /> {l.phone}
                </a>
                {(l.productName || l.message) && (
                  <div className="mt-2 space-y-1 text-[14px]">
                    {l.productName && (
                      <div>
                        <span className="text-muted">Mahsulot: </span>
                        {l.pageUrl ? (
                          <a href={l.pageUrl} target="_blank" rel="noopener" className="font-medium hover:text-accent">
                            {l.productName}
                          </a>
                        ) : (
                          <span className="font-medium">{l.productName}</span>
                        )}
                        {l.variant && <span className="text-muted"> · {l.variant}</span>}
                      </div>
                    )}
                    {l.message && <div className="whitespace-pre-line rounded-xl bg-canvas px-3 py-2 text-ink-2">{l.message}</div>}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`https://t.me/+${digits}`} target="_blank" rel="noopener" className="btn btn-sm btn-telegram" title="Telegramda yozish (raqam ochiq boʻlsa)">
                  <TelegramIcon className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isDone;
                    setDone((d) => ({ ...d, [l.id]: next }));
                    startTransition(async () => {
                      await setLeadStatusAction(l.id, next);
                      router.refresh();
                    });
                  }}
                  className={cn("btn btn-sm", isDone ? "btn-soft" : "btn-primary")}
                >
                  {isDone ? "Yangi deb belgilash" : "Bogʻlanildi"}
                </button>
                <ConfirmButton
                  className="grid size-9 place-items-center rounded-full text-sale hover:bg-sale-soft"
                  title="Soʻrovni oʻchirish"
                  onConfirm={async () => {
                    await deleteLeadAction(l.id);
                    toast("Soʻrov oʻchirildi");
                    router.refresh();
                  }}
                >
                  <Trash2 className="size-4" />
                </ConfirmButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
