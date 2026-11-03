"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({
  links,
}: {
  links: { href: string; label: string; tone?: "sale" }[];
}) {
  const pathname = usePathname();
  return (
    <ul className="no-scrollbar -ml-3 flex items-center overflow-x-auto">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center px-3 text-[14px] transition",
                link.tone === "sale"
                  ? "font-medium text-sale hover:text-[#b81d23]"
                  : active
                    ? "font-semibold text-ink"
                    : "font-medium text-ink-2 hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
