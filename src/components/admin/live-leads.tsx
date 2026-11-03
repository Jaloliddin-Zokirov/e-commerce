"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { InboxState } from "@/lib/types";
import { useToast } from "./ui";

const NewLeadsContext = createContext(0);

/**
 * Keeps every open admin tab in sync with the lead inbox via the server-sent event stream:
 * live "new" counter, a toast for each new lead and a refresh of the page that is open.
 */
export function LiveLeadsProvider({ initialNew, children }: { initialNew: number; children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [live, setLive] = useState<number | null>(null);
  const newCount = live ?? initialNew;

  useEffect(() => {
    const source = new EventSource("/api/admin/leads/stream");
    let previous: InboxState | null = null;
    source.onmessage = (event) => {
      const state = JSON.parse(event.data) as InboxState;
      setLive(state.newCount);
      if (previous) {
        if (state.lastId > previous.lastId && state.latest) {
          const who = state.latest.name || state.latest.phone;
          toast(state.latest.kind === "order" ? `🛒 Yangi buyurtma: ${who}` : `🔔 Qayta qoʻngʻiroq soʻrovi: ${who}`);
        }
        // Re-render the open page (lists, counters) with the fresh data.
        router.refresh();
      }
      previous = state;
    };
    return () => source.close();
  }, [router, toast]);

  // "(2) Soʻrovlar — Admin PRODUCT" in the browser tab while leads are waiting. Navigations and
  // refreshes write the page's own title back, so the prefix is re-applied whenever <head> changes.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\)\s/, "");
      const next = newCount > 0 ? `(${newCount}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [newCount]);

  return <NewLeadsContext.Provider value={newCount}>{children}</NewLeadsContext.Provider>;
}

/** Number of leads that are still "new", kept live by `LiveLeadsProvider`. */
export function useNewLeads(): number {
  return useContext(NewLeadsContext);
}
