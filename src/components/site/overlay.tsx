"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Side = "left" | "bottom" | "center" | "top" | "dialog";

const PANEL: Record<Side, string> = {
  left: "inset-y-0 left-0 w-[min(88vw,380px)] animate-drawer-in",
  bottom: "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px] animate-sheet-in",
  top: "inset-x-0 top-0 animate-fade-in",
  center:
    "left-1/2 top-1/2 max-h-[92dvh] w-[min(calc(100vw-24px),480px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] animate-pop-in",
  /** Bottom sheet on phones, centered card from the sm breakpoint up. */
  dialog:
    "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[24px] pb-[env(safe-area-inset-bottom)] animate-sheet-in sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:pb-0 sm:animate-pop-in",
};

/** Modal layer: backdrop, Escape to close, body scroll lock. */
export function Overlay({
  open,
  onClose,
  side = "center",
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn("absolute flex flex-col overflow-hidden bg-white shadow-pop", PANEL[side], className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
