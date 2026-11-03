import type { Currency, Locale, SiteSettings } from "./types";

/** Serializable pricing context shared by server and client components. */
export type PriceCtx = SiteSettings["currency"] & {
  locale: Locale;
  installment: SiteSettings["installment"];
};

export function priceCtx(settings: SiteSettings, locale: Locale): PriceCtx {
  return { ...settings.currency, installment: settings.installment, locale };
}

/** Group thousands with no-break spaces; deterministic on server and client. */
export function formatNumber(value: number, maxFractions = 0): string {
  const fixed = maxFractions > 0 ? value.toFixed(maxFractions) : String(Math.round(value));
  const [int, frac] = fixed.split(".");
  const sign = int.startsWith("-") ? "-" : "";
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const trimmedFrac = frac?.replace(/0+$/, "");
  return `${sign}${grouped}${trimmedFrac ? `,${trimmedFrac}` : ""}`;
}

export function formatMoney(amount: number, currency: Currency, locale: Locale): string {
  if (currency === "UZS") {
    return `${formatNumber(amount)} ${locale === "ru" ? "сум" : "soʻm"}`;
  }
  const fractions = Number.isInteger(amount) ? 0 : 2;
  return `${formatNumber(amount, fractions)} $`;
}

function roundTo(value: number, step: number): number {
  if (!step || step <= 1) return Math.round(value);
  return Math.round(value / step) * step;
}

/** Convert an amount stored in the base currency to `target`. */
export function convert(amount: number, target: Currency, ctx: PriceCtx): number {
  if (ctx.base === target) return amount;
  const rate = ctx.rate > 0 ? ctx.rate : 1;
  if (target === "UZS") return roundTo(amount * rate, ctx.roundTo);
  const usd = amount / rate;
  return usd >= 100 ? Math.round(usd) : Math.round(usd * 100) / 100;
}

export type DisplayPrice = { main: string; alt?: string };

/** Format a base-currency amount according to the store's display setting. */
export function displayPrice(amount: number, ctx: PriceCtx): DisplayPrice {
  const { locale } = ctx;
  if (ctx.display === "USD") return { main: formatMoney(convert(amount, "USD", ctx), "USD", locale) };
  const main = formatMoney(convert(amount, "UZS", ctx), "UZS", locale);
  if (ctx.display === "both") {
    return { main, alt: formatMoney(convert(amount, "USD", ctx), "USD", locale) };
  }
  return { main };
}

export function formatPrice(amount: number, ctx: PriceCtx): string {
  return displayPrice(amount, ctx).main;
}

/** "16 255 000 soʻm" -> "16 255 000 soʻmdan" (uz) / "от 16 255 000 сум" (ru). */
export function withFrom(main: string, locale: Locale): string {
  if (locale === "ru") return `от ${main}`;
  return /[a-zʻ'’]$/i.test(main) ? `${main}dan` : `${main} dan`;
}

/** Split a formatted amount into number and currency: ["16 255 000", "soʻm"]. */
export function splitMoney(text: string): [string, string] {
  const i = text.lastIndexOf(" ");
  return i > 0 ? [text.slice(0, i), text.slice(i + 1)] : [text, ""];
}

/** Monthly installment in the display currency, or null when disabled. */
export function monthlyPayment(amount: number, ctx: PriceCtx): string | null {
  const { enabled, months, markup } = ctx.installment;
  if (!enabled || months < 2 || amount <= 0) return null;
  const currency: Currency = ctx.display === "USD" ? "USD" : "UZS";
  const total = convert(amount, currency, ctx) * (1 + Math.max(0, markup) / 100);
  const monthly = currency === "UZS" ? roundTo(total / months, 1000) : Math.ceil(total / months);
  return formatMoney(monthly, currency, ctx.locale);
}

export function discountPercent(price: number, oldPrice: number | null | undefined): number {
  if (!oldPrice || oldPrice <= price || price <= 0) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/** "+998 90 123 45 67" -> "+998901234567" for tel: links. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** SQLite UTC timestamp ("2026-11-02 17:31:00") -> Tashkent local time. */
export function formatDateTime(sqliteUtc: string): string {
  const d = new Date(sqliteUtc.includes("T") ? sqliteUtc : `${sqliteUtc.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return sqliteUtc;
  return dateTimeFormat.format(d);
}
