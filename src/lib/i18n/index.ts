import type { Locale, Localized } from "../types";
import uz, { type Dict } from "./uz";
import ru from "./ru";

export type { Dict };

const dictionaries: Record<Locale, Dict> = { uz, ru };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

/** Pick the value for `locale`, falling back to the other language. */
export function tl(value: Localized | null | undefined, locale: Locale): string {
  if (!value) return "";
  const primary = value[locale]?.trim();
  if (primary) return primary;
  return (locale === "uz" ? value.ru : value.uz)?.trim() ?? "";
}

/** Replace `{key}` placeholders. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

type PluralForms = { one: string; few: string; many: string };

/** Russian-style plural selection (Uzbek forms are identical). */
export function plural(n: number, forms: PluralForms): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  let form = forms.many;
  if (mod10 === 1 && mod100 !== 11) form = forms.one;
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) form = forms.few;
  return fmt(form, { n });
}

/** Build a locale-prefixed path: href("uz", "/catalog") -> "/uz/catalog". */
export function href(locale: Locale, path = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}
