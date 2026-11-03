"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dict } from "@/lib/i18n";
import type { PriceCtx } from "@/lib/format";
import type { Locale } from "@/lib/types";

export type SiteContextValue = {
  locale: Locale;
  dict: Dict;
  price: PriceCtx;
  storeName: string;
  phones: string[];
  telegramUser: string;
  siteUrl: string;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ value, children }: { value: SiteContextValue; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite must be used inside <SiteProvider>");
  return value;
}
