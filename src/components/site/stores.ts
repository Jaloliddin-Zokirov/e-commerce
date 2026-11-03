"use client";

import { useCallback, useSyncExternalStore } from "react";

const EMPTY: number[] = [];

/** A tiny localStorage-backed list of product ids shared across components and tabs. */
function createIdStore(key: string, max: number) {
  let cache: number[] | null = null;
  const listeners = new Set<() => void>();

  const read = (): number[] => {
    if (cache) return cache;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      cache = Array.isArray(parsed) ? parsed.filter((v): v is number => Number.isInteger(v)) : [];
    } catch {
      cache = [];
    }
    return cache;
  };

  const write = (next: number[]) => {
    cache = next.slice(0, max);
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      // Private mode or full storage: keep the in-memory copy.
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { read, write, subscribe, server: () => EMPTY };
}

const favoritesStore = createIdStore("pd:favorites", 200);
const recentStore = createIdStore("pd:recent", 16);

export function useFavorites() {
  const ids = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.read, favoritesStore.server);
  const toggle = useCallback((id: number) => {
    const current = favoritesStore.read();
    favoritesStore.write(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]);
  }, []);
  const clear = useCallback(() => favoritesStore.write([]), []);
  return { ids, toggle, clear, has: (id: number) => ids.includes(id) };
}

export function useRecentlyViewed() {
  const ids = useSyncExternalStore(recentStore.subscribe, recentStore.read, recentStore.server);
  const push = useCallback((id: number) => {
    const current = recentStore.read();
    if (current[0] === id) return;
    recentStore.write([id, ...current.filter((x) => x !== id)]);
  }, []);
  return { ids, push };
}
