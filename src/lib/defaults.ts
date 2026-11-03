import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  storeName: "PRODUCT",
  tagline: {
    uz: "Texnika professionallar uchun",
    ru: "Техника для профессионалов",
  },
  about: {
    uz:
      "PRODUCT — professional yondashuvga ega texnika doʻkoni. Faqat rasmiy Apple, professional PC kompyuterlari, audio va video uskunalar.\n\nBizga kelib, qaysi sohada ishlashingizni yoki qaysi dasturlardan muntazam foydalanishingizni aytsangiz kifoya. Kompyuterni oʻzimiz tanlab, sozlab, kerakli dasturlarni oʻrnatib beramiz.",
    ru:
      "PRODUCT — магазин техники с профессиональным подходом. Только официальный Apple, профессиональные ПК, аудио- и видеооборудование.\n\nПросто расскажите, в какой сфере вы работаете или какими программами пользуетесь. Мы сами подберём компьютер, настроим его и установим нужные программы.",
  },
  // Demo contacts until launch: nothing here may reach a real person. The phone has no
  // operator code, the Telegram names are invalid, the links go to example.com and the
  // map shows the city centre. The owner enters the real data in Admin → Sozlamalar.
  phones: ["+998 00 000 00 00"],
  email: "",
  telegramUser: "demo_manager_",
  telegramChannel: "https://t.me/demo_channel_",
  instagram: "https://example.com/instagram",
  youtube: "",
  address: {
    uz: "Toshkent sh., Namuna koʻchasi, 1-uy (demo manzil)",
    ru: "г. Ташкент, ул. Образцовая, 1 (демо-адрес)",
  },
  landmark: { uz: "", ru: "" },
  workHours: { uz: "Har kuni 10:00 – 21:00", ru: "Ежедневно 10:00 – 21:00" },
  map: { lat: 41.3111, lng: 69.2797, zoom: 15 },
  currency: { base: "USD", display: "UZS", rate: 12050, roundTo: 1000 },
  installment: { enabled: false, months: 12, markup: 0 },
  announcement: {
    enabled: true,
    text: {
      uz: "Faqat rasmiy Apple · Professional PC · Audio · Video",
      ru: "Только официальный Apple · Профессиональные ПК · Аудио · Видео",
    },
    link: "",
  },
  telegramBot: { token: "", chatId: "" },
  seo: {
    title: {
      uz: "PRODUCT — Apple, PC, audio va video texnika Toshkentda",
      ru: "PRODUCT — Apple, ПК, аудио и видеотехника в Ташкенте",
    },
    description: {
      uz: "Rasmiy Apple texnikasi, professional kompyuterlar, audio va video uskunalar. Narxlar, xarakteristikalar va mutaxassis maslahati.",
      ru: "Официальная техника Apple, профессиональные компьютеры, аудио- и видеооборудование. Цены, характеристики и консультация специалиста.",
    },
  },
};
