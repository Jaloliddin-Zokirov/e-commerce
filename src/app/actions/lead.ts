"use server";

import { escapeHtml, normalizePhone, notifyTelegram } from "@/lib/notify";
import { createLead, hasRecentDuplicate, recentLeadsFromPhone } from "@/lib/repo/leads";
import { getSettings } from "@/lib/repo/settings";
import { isLocale, type LeadKind } from "@/lib/types";

export type LeadInput = {
  /** "order" — the «Buyurtma berish» form; "callback" — «Qayta qoʻngʻiroq». */
  kind: LeadKind;
  name: string;
  phone: string;
  message?: string;
  productId?: number | null;
  productName?: string;
  variant?: string;
  pageUrl?: string;
  locale: string;
};

export type LeadResult = { ok: true } | { ok: false; error: "name" | "phone" | "generic" };

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const kind: LeadKind = input.kind === "order" ? "order" : "callback";
  const name = clip(input.name, 80);
  // Both forms ask for a name. An order is never refused for it, though: a page opened before
  // the name field existed still sends orders without one, and a phone number is enough to call back.
  if (kind === "callback" && name.length < 2) return { ok: false, error: "name" };
  const phone = normalizePhone(clip(input.phone, 40));
  if (!phone) return { ok: false, error: "phone" };

  const locale = isLocale(input.locale) ? input.locale : "uz";
  const lead = {
    kind,
    name,
    phone,
    message: clip(input.message, 1000),
    productId: Number.isInteger(input.productId) ? (input.productId as number) : null,
    productName: clip(input.productName, 200),
    variant: clip(input.variant, 200),
    pageUrl: clip(input.pageUrl, 500),
    locale,
  };
  // The same form sent twice within a few minutes (double tap, retry) is stored once.
  if (hasRecentDuplicate(lead)) return { ok: true };
  // Flood guard: refuse openly instead of pretending to accept, so a real customer sees the error.
  if (recentLeadsFromPhone(phone) >= 20) {
    console.warn(`[lead] too many requests from ${phone}`);
    return { ok: false, error: "generic" };
  }
  try {
    createLead(lead);
  } catch (error) {
    console.error("[lead] could not be saved", error);
    return { ok: false, error: "generic" };
  }

  // TODO(order-delivery): for now every order/callback lands in Admin → Soʻrovlar, and is also
  // forwarded to the Telegram bot when Settings → Telegram is filled in. Decide with the owner
  // whether orders should go to a bot DM, a channel or a group, then finish this integration.
  const lines = [
    kind === "order" ? "<b>🛒 Yangi buyurtma</b>" : "<b>🔔 Qayta qoʻngʻiroq soʻrovi</b>",
    lead.name && `👤 ${escapeHtml(lead.name)}`,
    `📞 ${escapeHtml(lead.phone)}`,
    lead.productName && `📦 ${escapeHtml(lead.productName)}${lead.variant ? ` (${escapeHtml(lead.variant)})` : ""}`,
    lead.message && `💬 ${escapeHtml(lead.message)}`,
    lead.pageUrl && `🔗 ${escapeHtml(lead.pageUrl)}`,
    `🌐 ${locale.toUpperCase()}`,
  ].filter(Boolean);
  await notifyTelegram(getSettings(), lines.join("\n"));
  return { ok: true };
}
