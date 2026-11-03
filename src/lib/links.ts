export function telegramUsername(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
}

/** Direct chat link; the optional text pre-fills the message in Telegram apps. */
export function telegramChatUrl(username: string, text?: string): string {
  const user = telegramUsername(username);
  return `https://t.me/${user}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function yandexMapsUrl(lat: number, lng: number, zoom = 16): string {
  return `https://yandex.uz/maps/?pt=${lng},${lat}&z=${zoom}&l=map`;
}

export function yandexRouteUrl(lat: number, lng: number): string {
  return `https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`;
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function yandexEmbedUrl(lat: number, lng: number, zoom = 16, locale = "uz"): string {
  const lang = locale === "ru" ? "ru_RU" : "uz_UZ";
  return `https://yandex.uz/map-widget/v1/?ll=${lng}%2C${lat}&z=${zoom}&pt=${lng}%2C${lat}%2Cpm2rdm&lang=${lang}`;
}
