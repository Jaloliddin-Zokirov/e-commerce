"use client";

import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Overlay } from "./overlay";
import { SearchBox } from "./search-box";
import { useSite } from "./site-context";

export function MobileSearchButton({ className }: { className?: string }) {
  const { dict } = useSite();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.nav.search}
        className={className ?? "grid size-11 place-items-center rounded-full transition hover:bg-canvas"}
      >
        <Search className="size-[22px]" strokeWidth={1.8} />
      </button>
      <Overlay open={open} onClose={close} side="top" label={dict.nav.search} className="min-h-[60dvh] rounded-b-[28px]">
        <div className="flex items-center gap-2 p-3">
          <SearchBox autoFocus className="flex-1" onNavigate={close} />
          <button
            type="button"
            onClick={close}
            aria-label={dict.common.close}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-canvas"
          >
            <X className="size-5" />
          </button>
        </div>
      </Overlay>
    </>
  );
}
