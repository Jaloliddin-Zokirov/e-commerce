import { tl } from "./i18n";
import type { Locale, SpecGroup } from "./types";

export type HighlightKind =
  | "display"
  | "chip"
  | "gpu"
  | "memory"
  | "storage"
  | "camera"
  | "battery"
  | "sound"
  | "video"
  | "connection"
  | "water";

export type Highlight = { kind: HighlightKind; label: string; value: string };

/**
 * Spec labels (uz or ru) that make a good headline figure, in the order they are shown.
 * `group` lets the first row of a group with that title count too ("Kamera → Asosiy: 48 MP").
 */
const RULES: { kind: HighlightKind; re: RegExp; group?: boolean }[] = [
  { kind: "display", re: /diagonal|диагонал|displey|дисплей|ekran|экран/i, group: true },
  { kind: "chip", re: /^(chip|cpu)$|^чип$|protsessor|процессор/i },
  { kind: "memory", re: /operativ|оператив|^ram$/i },
  { kind: "storage", re: /^ssd$|^hajmi$|^объём$|накопител/i },
  { kind: "gpu", re: /videokarta|видеокарт|^gpu$/i },
  { kind: "camera", re: /kamera|камера|^sensor$|^сенсор$/i, group: true },
  { kind: "battery", re: /batareya|батаре|ishlash vaqti|время работы/i, group: true },
  { kind: "sound", re: /shovqin|шумоподав/i },
  { kind: "video", re: /^video$|^видео$/i },
  { kind: "connection", re: /^ulanish$|^подключение$|uzatish masofasi|дальность/i },
  { kind: "water", re: /suvga|водонепрон/i },
];

/** Row labels that only make sense under their group title ("Xotira → Hajmi"). */
const GENERIC_LABEL = /^(asosiy|turi|hajmi|основная|тип|объём)$/i;

/**
 * Picks up to `limit` headline specs ("6,3″ display", "A19 Pro chip"…) for the "at a glance" strip.
 * An item matches by its own label, or (for `group` rules) as the first row of a matching group.
 */
export function specHighlights(groups: SpecGroup[], locale: Locale, limit = 4): Highlight[] {
  const found = new Map<HighlightKind, Highlight>();
  for (const group of groups) {
    const groupTitles = [group.title.uz, group.title.ru].map((t) => t?.trim() ?? "");
    group.items.forEach((item, index) => {
      const value = tl(item.value, locale);
      if (!value) return;
      const labels = [item.label.uz, item.label.ru].map((t) => t?.trim() ?? "");
      for (const { kind, re, group: byTitle } of RULES) {
        if (found.has(kind)) continue;
        const byLabel = labels.some((l) => re.test(l));
        const byGroup = byTitle && index === 0 && groupTitles.some((t) => re.test(t));
        if (!byLabel && !byGroup) continue;
        const groupTitle = tl(group.title, locale);
        // "Ekran → Diagonal" reads better as "Ekran"; "Unumdorlik → Chip" as "Chip".
        const useGroup = groupTitles.some((t) => re.test(t)) || labels.some((l) => GENERIC_LABEL.test(l));
        const label = useGroup && groupTitle ? groupTitle : tl(item.label, locale);
        found.set(kind, { kind, label, value });
        break;
      }
    });
  }
  return RULES.map((r) => found.get(r.kind))
    .filter((h): h is Highlight => !!h)
    .slice(0, limit);
}
