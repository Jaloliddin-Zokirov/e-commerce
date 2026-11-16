import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  storeName: "LOGO",
  tagline: {
    uz: "Zamonaviy texnika doʻkoni",
    ru: "Магазин современной техники",
  },
  about: {
    uz:
      "Zamonaviy texnika doʻkoni: Apple mahsulotlari, kompyuterlar, audio va video uskunalar — rasmiy kafolat bilan.\n\nNarxlar va xarakteristikalar saytda. Buyurtmani bir daqiqada qoldirasiz — menejer qoʻngʻiroq qilib, barcha tafsilotlarni kelishib oladi.",
    ru:
      "Магазин современной техники: продукция Apple, компьютеры, аудио- и видеооборудование — с официальной гарантией.\n\nЦены и характеристики — на сайте. Заказ оформляется за минуту: менеджер перезвонит и согласует все детали.",
  },
  // No-name placeholder store: the name, logo, texts and contacts belong to no real business.
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
      uz: "Yangi mahsulotlar har hafta · Rasmiy kafolat · Onlayn buyurtma",
      ru: "Новинки каждую неделю · Официальная гарантия · Онлайн-заказ",
    },
    link: "",
  },
  telegramBot: { token: "", chatId: "" },
  seo: {
    title: {
      uz: "LOGO — Apple, kompyuterlar, audio va video texnika",
      ru: "LOGO — Apple, компьютеры, аудио- и видеотехника",
    },
    description: {
      uz: "Apple texnikasi, kompyuterlar, audio va video uskunalar katalogi: narxlar, xarakteristikalar va onlayn buyurtma.",
      ru: "Каталог техники Apple, компьютеров, аудио- и видеооборудования: цены, характеристики и онлайн-заказ.",
    },
  },
};
