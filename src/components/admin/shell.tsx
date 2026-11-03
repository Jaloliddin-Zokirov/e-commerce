"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/app/(admin)/admin/_actions/auth";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useNewLeads } from "./live-leads";

const NAV = [
  { href: "/admin", label: "Bosh panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Mahsulotlar", icon: Package },
  { href: "/admin/categories", label: "Kategoriyalar", icon: FolderTree },
  { href: "/admin/brands", label: "Brendlar", icon: Tags },
  { href: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
  { href: "/admin/leads", label: "Soʻrovlar", icon: Inbox, badge: "leads" as const },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const newLeads = useNewLeads();
  return (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition",
                active ? "bg-ink text-white" : "text-ink-2 hover:bg-white",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.9} />
              <span className="flex-1">{item.label}</span>
              {item.badge === "leads" && newLeads > 0 && (
                <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular", active ? "bg-white text-ink" : "bg-sale text-white")}>
                  {newLeads}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer() {
  return (
    <div className="space-y-0.5 border-t border-black/5 pt-3">
      <a href="/uz" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink-2 hover:bg-white">
        <ExternalLink className="size-[18px]" /> Saytni ochish
      </a>
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink-2 hover:bg-white">
          <LogOut className="size-[18px]" /> Chiqish
        </button>
      </form>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const newLeads = useNewLeads();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-black/5 bg-[#ededf0] p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2 pt-1">
          <Logo className="h-7 w-auto" />
          <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">admin</span>
        </Link>
        <nav className="flex-1 overflow-y-auto">
          <NavList />
        </nav>
        <Footer />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/5 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Menyu" className="relative grid size-10 place-items-center rounded-full hover:bg-canvas">
          <Menu className="size-6" />
          {newLeads > 0 && <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-sale ring-2 ring-white" />}
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">admin</span>
        </Link>
        <a href="/uz" target="_blank" aria-label="Saytni ochish" className="grid size-10 place-items-center rounded-full hover:bg-canvas">
          <ExternalLink className="size-5" />
        </a>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col gap-6 bg-[#ededf0] p-4 animate-drawer-in">
            <div className="flex items-center justify-between">
              <Logo className="h-7 w-auto" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Yopish" className="grid size-9 place-items-center rounded-full bg-white">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </nav>
            <Footer />
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-[1240px]">{children}</div>
      </main>
    </div>
  );
}
