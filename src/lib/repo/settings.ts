import "server-only";
import { getDb, parseJson } from "../db";
import { DEFAULT_SETTINGS } from "../defaults";
import type { SiteSettings } from "../types";

export function kvGet(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM kv WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function kvSet(key: string, value: string): void {
  getDb()
    .prepare("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

export function kvDelete(key: string): void {
  getDb().prepare("DELETE FROM kv WHERE key = ?").run(key);
}

/** Stored settings layered over defaults, so new fields always have a value. */
export function mergeSettings(stored: Partial<SiteSettings>): SiteSettings {
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const [key, value] of Object.entries(stored)) {
    if (!(key in DEFAULT_SETTINGS) || value === undefined || value === null) continue;
    const base = (DEFAULT_SETTINGS as Record<string, unknown>)[key];
    out[key] =
      base && typeof base === "object" && !Array.isArray(base)
        ? { ...(base as object), ...(value as object) }
        : value;
  }
  return out as SiteSettings;
}

export function getSettings(): SiteSettings {
  return mergeSettings(parseJson<Partial<SiteSettings>>(kvGet("site"), {}));
}

export function saveSettings(next: SiteSettings): void {
  kvSet("site", JSON.stringify(next));
}
