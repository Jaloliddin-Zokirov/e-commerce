"use client";

import Link from "next/link";
import { ChevronDown, Clock, Heart, MapPin, Menu, Percent, Phone, X } from "lucide-react";
import { useCallback, useState } from "react";
import { InstagramIcon, TelegramIcon } from "@/components/brand-icons";
import { Img } from "@/components/img";
import { Logo } from "@/components/logo";
import { telHref } from "@/lib/format";
import { href } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import type { MenuCategory } from "./menu-types";
import { Overlay } from "./overlay";
import { useSite } from "./site-context";

export function MobileMenu({
  tree,
  address,
  workHours,
  instagram,
  telegramChannel,
}: {
  tree: MenuCategory[];
  address: string;
  workHours: string;
  instagram: string;
  telegramChannel: string;
}) {
  const { dict, locale, phones, storeName } = useSite();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.nav.menu}
        className="grid size-11 place-items-center rounded-full transition hover:bg-canvas"
      >
        <Menu className="size-6" />
      </button>
      <Overlay open={open} onClose={close} side="left" label={dict.nav.menu}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Link href={href(locale)} onClick={close} aria-label={storeName}>
            <Logo className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label={dict.common.close}
            className="grid size-10 place-items-center rounded-full bg-canvas"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto px-3 py-3"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) close();
          }}
        >
          <ul className="space-y-0.5">
            {tree.map((c) => {
              const isOpen = expanded === c.id;
              return (
                <li key={c.id}>
                  <div className="flex items-center">
                    <Link href={c.href} className="flex flex-1 items-center gap-3 rounded-xl px-2 py-2 text-[16px] font-medium">
                      <span className="size-10 shrink-0 overflow-hidden rounded-xl bg-canvas">
                        {c.image && <Img asset={c.image} alt="" width={320} sizes="40px" className="size-full object-contain p-0.5" />}
                      </span>
                      {c.name}
                    </Link>
                    {c.children.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        aria-expanded={isOpen}
                        aria-label={c.name}
                        className="grid size-10 place-items-center rounded-full text-muted hover:bg-canvas"
                      >
                        <ChevronDown className={cn("size-5 transition", isOpen && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <ul className="mb-2 ml-[60px] space-y-0.5 animate-fade-in">
                      {c.children.map((child) => (
                        <li key={child.id}>
                          <Link href={child.href} className="block rounded-lg px-2 py-2 text-[15px] text-ink-2 hover:bg-canvas">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="my-3 h-px bg-line" />
          <ul className="space-y-0.5 text-[16px] font-medium">
            <li>
              <Link href={href(locale, "/sale")} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sale">
                <Percent className="size-5" /> {dict.nav.sale}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "/favorites")} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <Heart className="size-5" /> {dict.nav.favorites}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "/contacts")} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <MapPin className="size-5" /> {dict.nav.contacts}
              </Link>
            </li>
          </ul>
          <div className="mt-4 space-y-3 rounded-2xl bg-canvas p-4 text-[14px]">
            {phones.map((p) => (
              <a key={p} href={telHref(p)} className="flex items-center gap-2 text-[17px] font-semibold tabular">
                <Phone className="size-4" /> {p}
              </a>
            ))}
            {workHours && (
              <div className="flex items-start gap-2 text-muted">
                <Clock className="mt-0.5 size-4 shrink-0" /> {workHours}
              </div>
            )}
            {address && (
              <div className="flex items-start gap-2 text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {address}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {telegramChannel && (
                <a href={telegramChannel} target="_blank" rel="noopener" className="btn btn-sm btn-telegram flex-1">
                  <TelegramIcon className="size-4" /> Telegram
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener" className="btn btn-sm btn-outline flex-1">
                  <InstagramIcon className="size-4" /> Instagram
                </a>
              )}
            </div>
          </div>
        </nav>
        <div className="flex shrink-0 items-center justify-between border-t border-line px-4 py-3">
          <span className="text-[13px] text-muted">{dict.langName}</span>
          <LanguageSwitcher />
        </div>
      </Overlay>
    </>
  );
}
