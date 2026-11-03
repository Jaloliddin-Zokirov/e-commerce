import "server-only";
import type { SiteSettings } from "./types";

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Send a message through the store's own Telegram bot, if one is configured. */
export async function notifyTelegram(settings: SiteSettings, html: string): Promise<boolean> {
  const { token, chatId } = settings.telegramBot;
  if (!token.trim() || !chatId.trim()) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** "+998 90 123 45 67" from loosely typed input, or null when it is not a phone number. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 9) digits = `998${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.startsWith("998") && digits.length === 12) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return `+${digits}`;
}
