"use client";

import { MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { useCallback, useState } from "react";
import { TelegramIcon } from "@/components/brand-icons";
import { telHref } from "@/lib/format";
import { telegramChatUrl } from "@/lib/links";
import { cn } from "@/lib/utils";
import { LeadDialog } from "./lead-dialog";
import { useSite } from "./site-context";

/** Floating quick-contact button (desktop; phones use the tab bar and sticky CTAs). */
export function ContactFab() {
  const { dict, phones, telegramUser } = useSite();
  const [open, setOpen] = useState(false);
  const [lead, setLead] = useState(false);
  const closeLead = useCallback(() => setLead(false), []);
  const actions = [
    telegramUser && {
      key: "tg",
      label: dict.common.writeTelegram,
      href: telegramChatUrl(telegramUser),
      icon: <TelegramIcon className="size-5" />,
      tone: "bg-telegram text-white",
    },
    phones[0] && {
      key: "call",
      label: phones[0],
      href: telHref(phones[0]),
      icon: <Phone className="size-5" />,
      tone: "bg-ok text-white",
    },
  ].filter(Boolean) as { key: string; label: string; href: string; icon: React.ReactNode; tone: string }[];

  return (
    <div className="fixed bottom-6 right-6 z-30 hidden flex-col items-end gap-3 lg:flex">
      {open && (
        <div className="flex flex-col items-end gap-2 animate-pop-in">
          {actions.map((a) => (
            <a
              key={a.key}
              href={a.href}
              target={a.key === "tg" ? "_blank" : undefined}
              rel="noopener"
              className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-[14px] font-semibold shadow-pop ring-1 ring-black/5 transition hover:-translate-y-0.5"
            >
              {a.label}
              <span className={cn("grid size-10 place-items-center rounded-full", a.tone)}>{a.icon}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setLead(true);
              setOpen(false);
            }}
            className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-[14px] font-semibold shadow-pop ring-1 ring-black/5 transition hover:-translate-y-0.5"
          >
            {dict.common.requestCall}
            <span className="grid size-10 place-items-center rounded-full bg-ink text-white">
              <PhoneCall className="size-5" />
            </span>
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={dict.nav.contacts}
        className="grid size-14 place-items-center rounded-full bg-ink text-white shadow-pop transition hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
      <LeadDialog open={lead} onClose={closeLead} />
    </div>
  );
}
