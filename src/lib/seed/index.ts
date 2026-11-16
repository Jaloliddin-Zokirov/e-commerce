import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type Database from "better-sqlite3";
import { DEFAULT_SETTINGS } from "../defaults";
import { buildVariants, deriveProduct } from "../product-utils";
import { searchNormalize } from "../slug";
import type {
  Condition,
  ImageAsset,
  Localized,
  ProductOption,
  ProductVariant,
  SpecGroup,
  StockStatus,
} from "../types";
import * as art from "./art";

const L = (uz: string, ru: string = uz): Localized => ({ uz, ru });

type SpecRow = [string, string, string, string?];
const group = (id: string, title: Localized, rows: SpecRow[]): SpecGroup => ({
  id,
  title,
  items: rows.map(([lu, lr, vu, vr]) => ({ label: L(lu, lr), value: L(vu, vr ?? vu) })),
});

function colorOption(values: Array<[string, string, string, string?]>): ProductOption {
  return {
    id: "color",
    name: L("Rang", "Цвет"),
    kind: "color",
    values: values.map(([id, uz, hex, ru]) => ({ id, label: L(uz, ru ?? uz), hex })),
  };
}

function textOption(id: string, name: Localized, values: Array<[string, string, string?]>): ProductOption {
  return { id, name, kind: "text", values: values.map(([vid, uz, ru]) => ({ id: vid, label: L(uz, ru ?? uz) })) };
}

const STORAGE = L("Xotira", "Память");
const CONFIG = L("Konfiguratsiya", "Конфигурация");

type Offer = { price: number; oldPrice?: number | null; stock?: StockStatus };

type SeedProduct = {
  slug: string;
  cat: string;
  /** Brand slug from BRANDS; omitted for the store's own PC builds. */
  brand?: string;
  sku?: string;
  name: Localized;
  tagline: Localized;
  description: Localized;
  warranty: Localized;
  condition?: Condition;
  offer?: Offer;
  options?: ProductOption[];
  /** Price per variant, keyed by option values. */
  variantOffer?: (values: Record<string, string>) => Offer;
  images: Array<{ svg: string; color?: string }>;
  specs: SpecGroup[];
  isNew?: boolean;
  isHit?: boolean;
  isFeatured?: boolean;
  ageDays: number;
};

const APPLE_WARRANTY = L("1 yil rasmiy kafolat", "1 год официальной гарантии");
const WARRANTY_1Y = L("1 yil kafolat", "Гарантия 1 год");

const iphoneProColors: Array<[string, string, string, string?]> = [
  ["orange", "Cosmic Orange", "#f2793a"],
  ["blue", "Deep Blue", "#36415c"],
  ["silver", "Silver", "#e3e4e6"],
];

function phoneImages(colors: Array<[string, string, string, string?]>, style: "pro" | "air" | "base") {
  return colors.flatMap(([id, , hex]) => [
    { svg: art.phoneBack(hex, style), color: id },
    { svg: art.phoneFront(hex), color: id },
  ]);
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "iphone-17-pro",
    cat: "iphone",
    brand: "apple",
    sku: "IP17P",
    name: L("iPhone 17 Pro"),
    tagline: L("Uchta 48 MP kamera. A19 Pro.", "Три камеры 48 МП. A19 Pro."),
    description: L(
      "iPhone 17 Pro — alyuminiy unibody korpus, A19 Pro chipi va uchta 48 MP kameradan iborat Pro Fusion tizimi. Professional suratga olish, video montaj va ogʻir ilovalar uchun yaratilgan.\n\n- 6,3″ ProMotion displey, 120 Hz gacha\n- 48 MP asosiy, ultra keng va telefoto kameralar\n- 18 MP Center Stage old kamera\n- Bugʻ kamerali sovutish tizimi",
      "iPhone 17 Pro — алюминиевый корпус unibody, чип A19 Pro и система Pro Fusion из трёх камер по 48 МП. Создан для профессиональной съёмки, монтажа и тяжёлых приложений.\n\n- Дисплей 6,3″ ProMotion до 120 Гц\n- Основная, сверхширокая и телефото-камеры 48 МП\n- Фронтальная камера 18 МП Center Stage\n- Охлаждение с испарительной камерой",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption(iphoneProColors),
      textOption("storage", STORAGE, [["256", "256 GB", "256 ГБ"], ["512", "512 GB", "512 ГБ"], ["1tb", "1 TB", "1 ТБ"]]),
    ],
    variantOffer: (v) => {
      if (v.storage === "256") return { price: 1349, oldPrice: 1449 };
      if (v.storage === "512") return { price: 1549 };
      return { price: 1799, stock: v.color === "silver" ? "preorder" : "in_stock" };
    },
    images: phoneImages(iphoneProColors, "pro"),
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "6,3″"],
        ["Turi", "Тип", "Super Retina XDR OLED"],
        ["Yangilanish chastotasi", "Частота обновления", "ProMotion, 120 Hz gacha", "ProMotion, до 120 Гц"],
        ["Always-On", "Always-On", "Bor", "Есть"],
      ]),
      group("perf", L("Unumdorlik", "Производительность"), [["Chip", "Чип", "A19 Pro"]]),
      group("camera", L("Kamera", "Камера"), [
        ["Asosiy", "Основная", "48 MP Fusion", "48 МП Fusion"],
        ["Ultra keng", "Сверхширокая", "48 MP", "48 МП"],
        ["Telefoto", "Телефото", "48 MP", "48 МП"],
        ["Old kamera", "Фронтальная", "18 MP Center Stage", "18 МП Center Stage"],
      ]),
      group("body", L("Korpus va ulanish", "Корпус и связь"), [
        ["Korpus", "Корпус", "Alyuminiy unibody", "Алюминиевый unibody"],
        ["Port", "Разъём", "USB-C"],
        ["Aloqa", "Связь", "5G, Wi-Fi 7, Bluetooth 6"],
      ]),
    ],
    isNew: true,
    isHit: true,
    isFeatured: true,
    ageDays: 6,
  },
  {
    slug: "iphone-17-pro-max",
    cat: "iphone",
    brand: "apple",
    sku: "IP17PM",
    name: L("iPhone 17 Pro Max"),
    tagline: L("Eng katta ekran va eng uzoq ishlash.", "Самый большой экран и автономность."),
    description: L(
      "iPhone 17 Pro Max — 6,9″ ProMotion displey, A19 Pro chipi va Pro Fusion kamera tizimi. iPhone tarixidagi eng uzoq ishlaydigan batareyalardan biri va 2 TB gacha xotira.",
      "iPhone 17 Pro Max — дисплей 6,9″ ProMotion, чип A19 Pro и камеры Pro Fusion. Одна из самых ёмких батарей в истории iPhone и до 2 ТБ памяти.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption(iphoneProColors),
      textOption("storage", STORAGE, [
        ["256", "256 GB", "256 ГБ"],
        ["512", "512 GB", "512 ГБ"],
        ["1tb", "1 TB", "1 ТБ"],
        ["2tb", "2 TB", "2 ТБ"],
      ]),
    ],
    variantOffer: (v) =>
      ({ "256": { price: 1499 }, "512": { price: 1699 }, "1tb": { price: 1949 }, "2tb": { price: 2449, stock: "preorder" as StockStatus } })[
        v.storage
      ] ?? { price: 1499 },
    images: phoneImages(iphoneProColors, "pro"),
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "6,9″"],
        ["Turi", "Тип", "Super Retina XDR OLED"],
        ["Yangilanish chastotasi", "Частота обновления", "ProMotion, 120 Hz gacha", "ProMotion, до 120 Гц"],
      ]),
      group("perf", L("Unumdorlik", "Производительность"), [["Chip", "Чип", "A19 Pro"]]),
      group("camera", L("Kamera", "Камера"), [
        ["Asosiy", "Основная", "48 MP Fusion", "48 МП Fusion"],
        ["Ultra keng", "Сверхширокая", "48 MP", "48 МП"],
        ["Telefoto", "Телефото", "48 MP", "48 МП"],
      ]),
      group("memory", L("Xotira", "Память"), [["Hajmi", "Объём", "256 GB – 2 TB", "256 ГБ – 2 ТБ"]]),
    ],
    isNew: true,
    ageDays: 6,
  },
  {
    slug: "iphone-air",
    cat: "iphone",
    brand: "apple",
    sku: "IPAIR",
    name: L("iPhone Air"),
    tagline: L("Eng yupqa iPhone — 5,6 mm.", "Самый тонкий iPhone — 5,6 мм."),
    description: L(
      "iPhone Air — atigi 5,6 mm qalinlikdagi titan korpus, A19 Pro chipi va 48 MP Fusion kamera. Yengil, nafis va kuchli.",
      "iPhone Air — титановый корпус толщиной всего 5,6 мм, чип A19 Pro и камера 48 МП Fusion. Лёгкий, изящный и мощный.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["sky", "Sky Blue", "#bcd3e6"],
        ["gold", "Light Gold", "#e8d9bd"],
        ["white", "Cloud White", "#f1f1ef"],
        ["black", "Space Black", "#2b2b2e"],
      ]),
      textOption("storage", STORAGE, [["256", "256 GB", "256 ГБ"], ["512", "512 GB", "512 ГБ"], ["1tb", "1 TB", "1 ТБ"]]),
    ],
    variantOffer: (v) =>
      ({ "256": { price: 1099, oldPrice: 1249 }, "512": { price: 1299, oldPrice: 1449 }, "1tb": { price: 1549 } })[v.storage] ?? {
        price: 1099,
      },
    images: phoneImages(
      [
        ["sky", "", "#bcd3e6"],
        ["gold", "", "#e8d9bd"],
        ["white", "", "#f1f1ef"],
        ["black", "", "#2b2b2e"],
      ],
      "air",
    ),
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "6,5″"],
        ["Yangilanish chastotasi", "Частота обновления", "ProMotion, 120 Hz gacha", "ProMotion, до 120 Гц"],
      ]),
      group("perf", L("Unumdorlik", "Производительность"), [["Chip", "Чип", "A19 Pro"]]),
      group("camera", L("Kamera", "Камера"), [
        ["Asosiy", "Основная", "48 MP Fusion", "48 МП Fusion"],
        ["Old kamera", "Фронтальная", "18 MP Center Stage", "18 МП Center Stage"],
      ]),
      group("body", L("Korpus", "Корпус"), [
        ["Qalinligi", "Толщина", "5,6 mm", "5,6 мм"],
        ["Material", "Материал", "Titan", "Титан"],
        ["SIM", "SIM", "Faqat eSIM", "Только eSIM"],
      ]),
    ],
    isNew: true,
    ageDays: 9,
  },
  {
    slug: "iphone-17",
    cat: "iphone",
    brand: "apple",
    sku: "IP17",
    name: L("iPhone 17"),
    tagline: L("ProMotion endi asosiy iPhone’da.", "ProMotion теперь и в базовом iPhone."),
    description: L(
      "iPhone 17 — 120 Hz ProMotion displey, A19 chipi va 48 MP ikki kamerali tizim. Xotira 256 GB dan boshlanadi.",
      "iPhone 17 — дисплей ProMotion 120 Гц, чип A19 и двойная камера 48 МП. Память — от 256 ГБ.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["lavender", "Lavender", "#d9cde8"],
        ["sage", "Sage", "#b8c7ad"],
        ["mist", "Mist Blue", "#a9c0d8"],
        ["white", "White", "#f4f4f2"],
        ["black", "Black", "#2c2c2e"],
      ]),
      textOption("storage", STORAGE, [["256", "256 GB", "256 ГБ"], ["512", "512 GB", "512 ГБ"]]),
    ],
    variantOffer: (v) => (v.storage === "256" ? { price: 899 } : { price: 1099 }),
    images: phoneImages(
      [
        ["lavender", "", "#d9cde8"],
        ["sage", "", "#b8c7ad"],
        ["mist", "", "#a9c0d8"],
        ["white", "", "#f4f4f2"],
        ["black", "", "#2c2c2e"],
      ],
      "base",
    ),
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "6,3″"],
        ["Yangilanish chastotasi", "Частота обновления", "ProMotion, 120 Hz gacha", "ProMotion, до 120 Гц"],
      ]),
      group("perf", L("Unumdorlik", "Производительность"), [["Chip", "Чип", "A19"]]),
      group("camera", L("Kamera", "Камера"), [
        ["Asosiy", "Основная", "48 MP Fusion", "48 МП Fusion"],
        ["Ultra keng", "Сверхширокая", "48 MP", "48 МП"],
        ["Old kamera", "Фронтальная", "18 MP Center Stage", "18 МП Center Stage"],
      ]),
    ],
    isHit: true,
    ageDays: 20,
  },
  {
    slug: "macbook-pro-14-m5",
    cat: "mac",
    brand: "apple",
    sku: "MBP14M5",
    name: L("MacBook Pro 14″ M5"),
    tagline: L("Professional ish va AI uchun.", "Для профессиональной работы и AI."),
    description: L(
      "M5 chipli MacBook Pro 14″ — montaj, dasturlash va sunʼiy intellekt bilan ishlash uchun. Liquid Retina XDR displey va 24 soatgacha batareya.\n\n- 10 yadroli CPU va 10 yadroli GPU\n- Thunderbolt 4, HDMI, SDXC va MagSafe 3\n- 12 MP Center Stage kamera",
      "MacBook Pro 14″ на чипе M5 — для монтажа, программирования и работы с AI. Дисплей Liquid Retina XDR и до 24 часов автономности.\n\n- 10-ядерный CPU и 10-ядерный GPU\n- Thunderbolt 4, HDMI, SDXC и MagSafe 3\n- Камера 12 МП Center Stage",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["black", "Space Black", "#2e2e30"],
        ["silver", "Silver", "#d6d7d9"],
      ]),
      textOption("config", CONFIG, [
        ["16-512", "16 GB / 512 GB", "16 ГБ / 512 ГБ"],
        ["16-1tb", "16 GB / 1 TB", "16 ГБ / 1 ТБ"],
        ["24-1tb", "24 GB / 1 TB", "24 ГБ / 1 ТБ"],
      ]),
    ],
    variantOffer: (v) =>
      ({ "16-512": { price: 1749 }, "16-1tb": { price: 1949 }, "24-1tb": { price: 2199 } })[v.config] ?? { price: 1749 },
    images: [
      { svg: art.laptopOpen("#2e2e30"), color: "black" },
      { svg: art.laptopClosed("#2e2e30"), color: "black" },
      { svg: art.laptopOpen("#d6d7d9"), color: "silver" },
      { svg: art.laptopClosed("#d6d7d9"), color: "silver" },
    ],
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "14,2″"],
        ["Turi", "Тип", "Liquid Retina XDR"],
      ]),
      group("perf", L("Unumdorlik", "Производительность"), [
        ["Chip", "Чип", "Apple M5"],
        ["CPU", "CPU", "10 yadro", "10 ядер"],
        ["GPU", "GPU", "10 yadro", "10 ядер"],
        ["Operativ xotira", "Оперативная память", "16 / 24 GB", "16 / 24 ГБ"],
        ["SSD", "SSD", "512 GB / 1 TB", "512 ГБ / 1 ТБ"],
      ]),
      group("ports", L("Portlar va batareya", "Порты и батарея"), [
        ["Portlar", "Порты", "3× Thunderbolt 4, HDMI, SDXC, MagSafe 3, 3,5 mm"],
        ["Batareya", "Батарея", "24 soatgacha", "До 24 часов"],
        ["Kamera", "Камера", "12 MP Center Stage", "12 МП Center Stage"],
      ]),
    ],
    isNew: true,
    isFeatured: true,
    ageDays: 12,
  },
  {
    slug: "macbook-air-13-m4",
    cat: "mac",
    brand: "apple",
    sku: "MBA13M4",
    name: L("MacBook Air 13″ M4"),
    tagline: L("Yengil. Jim. Kuchli.", "Лёгкий. Тихий. Мощный."),
    description: L(
      "M4 chipli MacBook Air 13″ — oʻqish, ofis va ijod uchun eng yaxshi tanlov. Ventilyatorsiz, butunlay jim ishlaydi va 18 soatgacha quvvat saqlaydi.",
      "MacBook Air 13″ на M4 — лучший выбор для учёбы, офиса и творчества. Без вентилятора, работает бесшумно и до 18 часов без подзарядки.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["sky", "Sky Blue", "#c5d6e4"],
        ["silver", "Silver", "#d9dadc"],
        ["starlight", "Starlight", "#e6ddcd"],
        ["midnight", "Midnight", "#2f3644"],
      ]),
      textOption("config", CONFIG, [
        ["16-256", "16 GB / 256 GB", "16 ГБ / 256 ГБ"],
        ["16-512", "16 GB / 512 GB", "16 ГБ / 512 ГБ"],
        ["24-512", "24 GB / 512 GB", "24 ГБ / 512 ГБ"],
      ]),
    ],
    variantOffer: (v) =>
      ({
        "16-256": { price: 1049, oldPrice: 1149 },
        "16-512": { price: 1249, oldPrice: 1349 },
        "24-512": { price: 1449 },
      })[v.config] ?? { price: 1049 },
    images: [
      ["sky", "#c5d6e4"],
      ["silver", "#d9dadc"],
      ["starlight", "#e6ddcd"],
      ["midnight", "#2f3644"],
    ].flatMap(([id, hex]) => [
      { svg: art.laptopClosed(hex), color: id },
      { svg: art.laptopOpen(hex), color: id },
    ]),
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "13,6″"],
        ["Turi", "Тип", "Liquid Retina"],
      ]),
      group("perf", L("Unumdorlik", "Производительность"), [
        ["Chip", "Чип", "Apple M4"],
        ["Operativ xotira", "Оперативная память", "16 / 24 GB", "16 / 24 ГБ"],
        ["SSD", "SSD", "256 / 512 GB", "256 / 512 ГБ"],
        ["Sovutish", "Охлаждение", "Passiv, ventilyatorsiz", "Пассивное, без вентилятора"],
      ]),
      group("ports", L("Portlar va batareya", "Порты и батарея"), [
        ["Portlar", "Порты", "2× Thunderbolt 4, MagSafe 3, 3,5 mm"],
        ["Batareya", "Батарея", "18 soatgacha", "До 18 часов"],
        ["Kamera", "Камера", "12 MP Center Stage", "12 МП Center Stage"],
      ]),
    ],
    isHit: true,
    ageDays: 40,
  },
  {
    slug: "imac-24-m4-refurbished",
    cat: "mac",
    brand: "apple",
    sku: "IMACM4R",
    name: L("iMac 24″ M4 (Refurbished)"),
    tagline: L("Yangisidan 200 $ arzon.", "На 200 $ дешевле нового."),
    description: L(
      "Apple Certified Refurbished — Apple tomonidan tekshirilgan, tozalangan va qayta qadoqlangan iMac, 1 yillik rasmiy kafolat bilan. Uy, ofis va oʻqish uchun ideal variant.\n\n- 24″ 4,5K Retina displey\n- M4 chip, 16 GB operativ xotira\n- 12 MP Center Stage kamera",
      "Apple Certified Refurbished — iMac, проверенный и переупакованный Apple, с официальной гарантией 1 год. Идеальный вариант для дома, офиса и учёбы.\n\n- Дисплей 4,5K Retina 24″\n- Чип M4, 16 ГБ оперативной памяти\n- Камера 12 МП Center Stage",
    ),
    warranty: APPLE_WARRANTY,
    condition: "refurbished",
    options: [
      colorOption([
        ["blue", "Blue", "#5b8fc7", "Синий"],
        ["green", "Green", "#7fb89a", "Зелёный"],
        ["pink", "Pink", "#e7a3a8", "Розовый"],
        ["silver", "Silver", "#d9dadc", "Серебристый"],
      ]),
    ],
    variantOffer: (v) => ({ price: 1449, oldPrice: 1649, stock: v.color === "pink" ? "out_of_stock" : "in_stock" }),
    images: [
      ["blue", "#5b8fc7"],
      ["green", "#7fb89a"],
      ["pink", "#e7a3a8"],
      ["silver", "#d9dadc"],
    ].map(([id, hex]) => ({ svg: art.imac(hex), color: id })),
    specs: [
      group("display", L("Ekran", "Экран"), [["Displey", "Дисплей", "24″ 4,5K Retina"]]),
      group("perf", L("Unumdorlik", "Производительность"), [
        ["Chip", "Чип", "Apple M4"],
        ["Operativ xotira", "Оперативная память", "16 GB", "16 ГБ"],
        ["SSD", "SSD", "256 GB", "256 ГБ"],
      ]),
      group("extra", L("Qoʻshimcha", "Дополнительно"), [
        ["Holati", "Состояние", "Apple Certified Refurbished"],
        ["Kamera", "Камера", "12 MP Center Stage", "12 МП Center Stage"],
        ["Komplekt", "Комплект", "Magic Keyboard, Magic Mouse"],
      ]),
    ],
    isFeatured: true,
    ageDays: 5,
  },
  {
    slug: "mac-mini-m5-pro",
    cat: "mac",
    brand: "apple",
    sku: "MMINIM5P",
    name: L("Mac mini M5 Pro 24/512 GB", "Mac mini M5 Pro 24/512 ГБ"),
    tagline: L("Kichik korpus — katta quvvat.", "Маленький корпус — большая мощность."),
    description: L(
      "M5 Pro chipli Mac mini — AI bilan ishlash, montaj va dasturlash uchun ixcham ish stansiyasi. Studio Display, Magic Keyboard va Trackpad bilan toʻliq setup yigʻib beramiz.",
      "Mac mini на M5 Pro — компактная рабочая станция для AI, монтажа и разработки. Соберём полный сетап со Studio Display, Magic Keyboard и Trackpad.",
    ),
    warranty: APPLE_WARRANTY,
    offer: { price: 2050 },
    images: [{ svg: art.macMini() }],
    specs: [
      group("perf", L("Unumdorlik", "Производительность"), [
        ["Chip", "Чип", "Apple M5 Pro"],
        ["Operativ xotira", "Оперативная память", "24 GB", "24 ГБ"],
        ["SSD", "SSD", "512 GB", "512 ГБ"],
      ]),
    ],
    isNew: true,
    ageDays: 2,
  },
  {
    slug: "studio-display-nano-texture",
    cat: "mac",
    brand: "apple",
    sku: "SDNANO",
    name: L("Studio Display (Nano-texture)"),
    tagline: L("27″ 5K Retina. Nano-teksturali shisha.", "27″ 5K Retina. Стекло nano-texture."),
    description: L(
      "27 dyuymli 5K Retina displey, nano-teksturali shisha va qiyaligi hamda balandligi sozlanadigan tayanch. Yorugʻ xonada ham aks ettirmaydi — dizayn va montaj uchun ideal.",
      "Дисплей 5K Retina 27″, стекло nano-texture и подставка с регулировкой наклона и высоты. Не бликует даже в светлой комнате — идеально для дизайна и монтажа.",
    ),
    warranty: APPLE_WARRANTY,
    offer: { price: 2500 },
    images: [{ svg: art.display() }],
    specs: [
      group("display", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "27″"],
        ["Ruxsat", "Разрешение", "5120 × 2880 (5K)"],
        ["Yorqinlik", "Яркость", "600 nit", "600 нит"],
        ["Rang", "Цвет", "P3 keng rang gammasi", "Широкий цветовой охват P3"],
        ["Shisha", "Стекло", "Nano-texture"],
      ]),
      group("extra", L("Qoʻshimcha", "Дополнительно"), [
        ["Kamera", "Камера", "12 MP Ultra Wide, Center Stage", "12 МП Ultra Wide, Center Stage"],
        ["Ovoz", "Звук", "6 ta dinamik, Spatial Audio", "6 динамиков, Spatial Audio"],
        ["Portlar", "Порты", "1× Thunderbolt 3, 3× USB-C"],
        ["Tayanch", "Подставка", "Qiyalik va balandlik sozlanadi", "Регулировка наклона и высоты"],
      ]),
    ],
    ageDays: 30,
  },
  {
    slug: "magic-keyboard-touch-id",
    cat: "acc",
    brand: "apple",
    sku: "MKTID",
    name: L("Magic Keyboard (Touch ID)"),
    tagline: L("Barmoq izi bilan kirish va Apple Pay.", "Вход по отпечатку и Apple Pay."),
    description: L(
      "Touch ID bilan Mac’ga tez va xavfsiz kirish, Apple Pay orqali toʻlov. Simsiz, zaryadlanadigan, USB-C kabel bilan.",
      "Быстрый и безопасный вход в Mac с Touch ID и оплата через Apple Pay. Беспроводная, с аккумулятором и кабелем USB-C.",
    ),
    warranty: APPLE_WARRANTY,
    offer: { price: 180 },
    images: [{ svg: art.keyboard() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Ulanish", "Подключение", "Bluetooth, USB-C"],
        ["Touch ID", "Touch ID", "Apple silicon’li Mac bilan", "С Mac на Apple silicon"],
        ["Quvvat", "Питание", "Ichki akkumulyator", "Встроенный аккумулятор"],
      ]),
    ],
    ageDays: 60,
  },
  {
    slug: "magic-trackpad",
    cat: "acc",
    brand: "apple",
    sku: "MTP",
    name: L("Magic Trackpad"),
    tagline: L("Katta Multi-Touch yuza.", "Большая поверхность Multi-Touch."),
    description: L(
      "Keng Multi-Touch yuza, Force Touch va qulay imo-ishoralar. Simsiz, USB-C orqali zaryadlanadi.",
      "Широкая поверхность Multi-Touch, Force Touch и удобные жесты. Беспроводной, заряжается через USB-C.",
    ),
    warranty: APPLE_WARRANTY,
    offer: { price: 170 },
    images: [{ svg: art.trackpad() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Texnologiya", "Технология", "Multi-Touch, Force Touch"],
        ["Ulanish", "Подключение", "Bluetooth, USB-C"],
      ]),
    ],
    ageDays: 60,
  },
  {
    slug: "airpods-max",
    cat: "airpods",
    brand: "apple",
    sku: "APMAX",
    name: L("AirPods Max (USB-C)"),
    tagline: L("Kuchli ANC va lossless ovoz.", "Мощный ANC и lossless-звук."),
    description: L(
      "AirPods Max — kuchli faol shovqin bekor qilish (ANC), shaxsiylashtirilgan fazoviy audio va USB-C orqali lossless tovush. 20 soatgacha uzluksiz tinglash.",
      "AirPods Max — мощное активное шумоподавление, персонализированное пространственное аудио и lossless-звук через USB-C. До 20 часов прослушивания.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["midnight", "Midnight", "#30343a"],
        ["starlight", "Starlight", "#e8e1d4"],
        ["blue", "Blue", "#9cb4cb"],
        ["purple", "Purple", "#c8b7d5"],
        ["orange", "Orange", "#efa36b"],
      ]),
    ],
    variantOffer: () => ({ price: 579, oldPrice: 649 }),
    images: [
      ["midnight", "#30343a"],
      ["starlight", "#e8e1d4"],
      ["blue", "#9cb4cb"],
      ["purple", "#c8b7d5"],
      ["orange", "#efa36b"],
    ].map(([id, hex]) => ({ svg: art.headphones(hex), color: id })),
    specs: [
      group("sound", L("Ovoz", "Звук"), [
        ["Shovqin bekor qilish", "Шумоподавление", "Faol (ANC) + Transparency", "Активное (ANC) + Прозрачность"],
        ["Fazoviy audio", "Пространственное аудио", "Personalized Spatial Audio"],
        ["Lossless", "Lossless", "USB-C orqali", "Через USB-C"],
      ]),
      group("battery", L("Batareya", "Батарея"), [
        ["Ishlash vaqti", "Время работы", "20 soatgacha", "До 20 часов"],
        ["Zaryadlash", "Зарядка", "USB-C"],
      ]),
    ],
    isHit: true,
    ageDays: 25,
  },
  {
    slug: "airpods-pro-3",
    cat: "airpods",
    brand: "apple",
    sku: "APP3",
    name: L("AirPods Pro 3"),
    tagline: L("Yanada kuchli ANC. Yurak urishi sensori.", "Ещё сильнее ANC. Датчик пульса."),
    description: L(
      "AirPods Pro 3 — yangilangan faol shovqin bekor qilish, mashgʻulotlar uchun yurak urishi sensori va IP57 himoya.",
      "AirPods Pro 3 — обновлённое активное шумоподавление, датчик пульса для тренировок и защита IP57.",
    ),
    warranty: APPLE_WARRANTY,
    offer: { price: 279 },
    images: [{ svg: art.earbudsCase() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Shovqin bekor qilish", "Шумоподавление", "Faol (ANC)", "Активное (ANC)"],
        ["Sensorlar", "Датчики", "Yurak urishi sensori", "Датчик пульса"],
        ["Himoya", "Защита", "IP57"],
      ]),
    ],
    isHit: true,
    ageDays: 35,
  },
  {
    slug: "apple-watch-ultra-3",
    cat: "watch",
    brand: "apple",
    sku: "AWU3",
    name: L("Apple Watch Ultra 3"),
    tagline: L("Eng mustahkam Apple Watch.", "Самые выносливые Apple Watch."),
    description: L(
      "49 mm titan korpus, keng burchakli OLED displey, sunʼiy yoʻldosh orqali SOS va 42 soatgacha ishlash. Sport, sayohat va ekstremal sharoitlar uchun.",
      "Титановый корпус 49 мм, широкоугольный OLED-дисплей, SOS через спутник и до 42 часов работы. Для спорта, путешествий и экстремальных условий.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["natural", "Natural Titanium", "#cfc8bd"],
        ["black", "Black Titanium", "#3a3a3c"],
      ]),
    ],
    variantOffer: () => ({ price: 849 }),
    images: [
      { svg: art.watch("#cfc8bd", "#f08a3e"), color: "natural" },
      { svg: art.watch("#3a3a3c", "#2f3640"), color: "black" },
    ],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Korpus", "Корпус", "49 mm, titan", "49 мм, титан"],
        ["Displey", "Дисплей", "Keng burchakli OLED, Always-On", "Широкоугольный OLED, Always-On"],
        ["Batareya", "Батарея", "42 soatgacha", "До 42 часов"],
        ["Aloqa", "Связь", "GPS + Cellular, sunʼiy yoʻldosh SOS", "GPS + Cellular, SOS через спутник"],
        ["Suvga chidamlilik", "Водонепроницаемость", "100 m", "100 м"],
      ]),
    ],
    ageDays: 28,
  },
  {
    slug: "ipad-air-11-m3",
    cat: "ipad",
    brand: "apple",
    sku: "IPADAIR11",
    name: L("iPad Air 11″ M3"),
    tagline: L("Yengil planshet, M3 quvvati.", "Лёгкий планшет с мощностью M3."),
    description: L(
      "M3 chipli iPad Air — ish, oʻqish va ijod uchun. Apple Pencil Pro va Magic Keyboard bilan ishlaydi.",
      "iPad Air на M3 — для работы, учёбы и творчества. Поддерживает Apple Pencil Pro и Magic Keyboard.",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      colorOption([
        ["gray", "Space Gray", "#6e6f73"],
        ["blue", "Blue", "#9fb7d6"],
        ["purple", "Purple", "#c4b5d8"],
        ["starlight", "Starlight", "#e6ddcd"],
      ]),
      textOption("storage", STORAGE, [["128", "128 GB", "128 ГБ"], ["256", "256 GB", "256 ГБ"], ["512", "512 GB", "512 ГБ"]]),
    ],
    variantOffer: (v) => ({ "128": { price: 649 }, "256": { price: 749 }, "512": { price: 949 } })[v.storage] ?? { price: 649 },
    images: [
      ["gray", "#6e6f73"],
      ["blue", "#9fb7d6"],
      ["purple", "#c4b5d8"],
      ["starlight", "#e6ddcd"],
    ].map(([id, hex]) => ({ svg: art.tablet(hex), color: id })),
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Displey", "Дисплей", "11″ Liquid Retina"],
        ["Chip", "Чип", "Apple M3"],
        ["Kamera", "Камера", "12 MP", "12 МП"],
        ["Xavfsizlik", "Безопасность", "Touch ID"],
        ["Port", "Разъём", "USB-C"],
        ["Stilus", "Стилус", "Apple Pencil Pro"],
      ]),
    ],
    ageDays: 50,
  },
  {
    slug: "apple-tv-4k",
    cat: "tv",
    brand: "apple",
    sku: "ATV4K",
    name: L("Apple TV 4K"),
    tagline: L("Kino va oʻyinlar katta ekranda.", "Кино и игры на большом экране."),
    description: L(
      "Filmlar, seriallar va oʻyinlarni Dolby Vision va Dolby Atmos sifatida katta ekranda tomosha qiling. Siri Remote (USB-C) bilan.",
      "Смотрите фильмы, сериалы и игры на большом экране в Dolby Vision и Dolby Atmos. В комплекте Siri Remote (USB-C).",
    ),
    warranty: APPLE_WARRANTY,
    options: [
      textOption("model", L("Model", "Модель"), [
        ["64", "64 GB Wi-Fi", "64 ГБ Wi-Fi"],
        ["128", "128 GB Wi-Fi + Ethernet", "128 ГБ Wi-Fi + Ethernet"],
      ]),
    ],
    variantOffer: (v) => (v.model === "64" ? { price: 169 } : { price: 199 }),
    images: [{ svg: art.tvBox() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Chip", "Чип", "A15 Bionic"],
        ["Video", "Видео", "4K, Dolby Vision, HDR10+"],
        ["Ovoz", "Звук", "Dolby Atmos"],
        ["Pult", "Пульт", "Siri Remote (USB-C)"],
      ]),
    ],
    ageDays: 70,
  },
  {
    slug: "creator-pc",
    cat: "builds",
    sku: "PC-CREATOR",
    name: L("Creator PC — Ryzen 9 9950X3D / RTX 5080"),
    tagline: L("Montaj, 3D va AI uchun ish stansiyasi.", "Рабочая станция для монтажа, 3D и AI."),
    description: L(
      "Montaj, 3D, rendering va sunʼiy intellekt bilan ishlash uchun ish stansiyasi.\n\n- Windows 11 Pro oʻrnatilgan holda topshiriladi\n- Har bir yigʻma stress-testdan oʻtkaziladi\n- 2 yil kafolat",
      "Рабочая станция для монтажа, 3D, рендеринга и работы с AI.\n\n- Выдаём с установленной Windows 11 Pro\n- Каждая сборка проходит стресс-тест\n- Гарантия 2 года",
    ),
    warranty: L("2 yil kafolat", "Гарантия 2 года"),
    offer: { price: 4290, stock: "preorder" },
    images: [{ svg: art.pcTower("#ff7a18", "#ffd166") }],
    specs: [
      group("main", L("Konfiguratsiya", "Конфигурация"), [
        ["Protsessor", "Процессор", "AMD Ryzen 9 9950X3D (16 yadro / 32 oqim)", "AMD Ryzen 9 9950X3D (16 ядер / 32 потока)"],
        ["Videokarta", "Видеокарта", "NVIDIA GeForce RTX 5080 16 GB", "NVIDIA GeForce RTX 5080 16 ГБ"],
        ["Operativ xotira", "Оперативная память", "64 GB DDR5-6000", "64 ГБ DDR5-6000"],
        ["SSD", "SSD", "2 TB NVMe PCIe 4.0", "2 ТБ NVMe PCIe 4.0"],
        ["Sovutish", "Охлаждение", "360 mm suyuqlikli", "Жидкостное 360 мм"],
        ["Quvvat bloki", "Блок питания", "1000 W 80+ Gold"],
        ["OT", "ОС", "Windows 11 Pro"],
      ]),
    ],
    isFeatured: true,
    ageDays: 15,
  },
  {
    slug: "gaming-pc",
    cat: "builds",
    sku: "PC-GAMING",
    name: L("Gaming PC — Ryzen 7 9800X3D / RTX 5070 Ti"),
    tagline: L("1440p va 4K oʻyinlar uchun.", "Для игр в 1440p и 4K."),
    description: L(
      "Oʻyinlar va striming uchun muvozanatli yigʻma: eng tezkor gaming protsessorlaridan biri va RTX 5070 Ti.",
      "Сбалансированная сборка для игр и стриминга: один из самых быстрых игровых процессоров и RTX 5070 Ti.",
    ),
    warranty: L("2 yil kafolat", "Гарантия 2 года"),
    offer: { price: 2490, oldPrice: 2690 },
    images: [{ svg: art.pcTower() }],
    specs: [
      group("main", L("Konfiguratsiya", "Конфигурация"), [
        ["Protsessor", "Процессор", "AMD Ryzen 7 9800X3D"],
        ["Videokarta", "Видеокарта", "NVIDIA GeForce RTX 5070 Ti 16 GB", "NVIDIA GeForce RTX 5070 Ti 16 ГБ"],
        ["Operativ xotira", "Оперативная память", "32 GB DDR5-6000", "32 ГБ DDR5-6000"],
        ["SSD", "SSD", "1 TB NVMe PCIe 4.0", "1 ТБ NVMe PCIe 4.0"],
        ["Quvvat bloki", "Блок питания", "850 W 80+ Gold"],
        ["OT", "ОС", "Windows 11"],
      ]),
    ],
    isHit: true,
    ageDays: 18,
  },
  {
    slug: "dell-ultrasharp-u2723qe",
    cat: "monitors",
    brand: "dell",
    sku: "U2723QE",
    name: L("Dell UltraSharp 27″ 4K U2723QE"),
    tagline: L("IPS Black, USB-C 90 W.", "IPS Black, USB-C 90 Вт."),
    description: L(
      "27″ 4K monitor IPS Black panel bilan: chuqur qora rang va aniq ranglar. USB-C orqali noutbukni 90 W gacha zaryadlaydi, ichida USB hub va Ethernet bor.",
      "Монитор 4K 27″ с панелью IPS Black: глубокий чёрный и точные цвета. Заряжает ноутбук через USB-C до 90 Вт, есть USB-хаб и Ethernet.",
    ),
    warranty: L("3 yil kafolat", "Гарантия 3 года"),
    offer: { price: 649 },
    images: [{ svg: art.monitor() }],
    specs: [
      group("main", L("Ekran", "Экран"), [
        ["Diagonal", "Диагональ", "27″"],
        ["Ruxsat", "Разрешение", "3840 × 2160 (4K)"],
        ["Panel", "Матрица", "IPS Black"],
        ["Kontrast", "Контраст", "2000:1"],
        ["Rang qamrovi", "Цветовой охват", "98% DCI-P3"],
      ]),
      group("ports", L("Portlar", "Порты"), [
        ["USB-C", "USB-C", "90 W quvvat bilan", "С питанием 90 Вт"],
        ["Tarmoq", "Сеть", "RJ45 Ethernet"],
      ]),
    ],
    ageDays: 90,
  },
  {
    slug: "dji-mic-2",
    cat: "audio",
    brand: "dji",
    sku: "DJIMIC2",
    name: L("DJI Mic 2 (2 TX + 1 RX)"),
    tagline: L("Simsiz mikrofon tizimi.", "Беспроводная микрофонная система."),
    description: L(
      "Ikki uzatgich va qabul qilgichdan iborat simsiz mikrofon tizimi: 32-bit float ichki yozuv, aqlli shovqin bekor qilish va 250 m gacha uzatish. Blog, intervyu va podkastlar uchun.",
      "Беспроводная система из двух передатчиков и приёмника: внутренняя запись 32-bit float, интеллектуальное шумоподавление и передача до 250 м. Для блогов, интервью и подкастов.",
    ),
    warranty: WARRANTY_1Y,
    offer: { price: 329, oldPrice: 359 },
    images: [{ svg: art.micKit() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Komplekt", "Комплект", "2 ta uzatgich, qabul qilgich, zaryadlovchi keys", "2 передатчика, приёмник, зарядный кейс"],
        ["Uzatish masofasi", "Дальность", "250 m gacha", "До 250 м"],
        ["Ichki yozuv", "Внутренняя запись", "32-bit float"],
        ["Batareya", "Батарея", "Keys bilan 18 soatgacha", "До 18 часов с кейсом"],
      ]),
    ],
    isHit: true,
    ageDays: 45,
  },
  {
    slug: "shure-sm7b",
    cat: "audio",
    brand: "shure",
    sku: "SM7B",
    name: L("Shure SM7B"),
    tagline: L("Studiya va podkastlar afsonasi.", "Легенда студий и подкастов."),
    description: L(
      "Dinamik vokal mikrofoni — podkast, striming va studiya yozuvlari uchun klassika. Xona shovqinini yaxshi kesadi va ovozga iliq, toʻyingan tembr beradi.",
      "Динамический вокальный микрофон — классика для подкастов, стримов и студийной записи. Хорошо отсекает шум помещения и даёт тёплый, плотный тембр.",
    ),
    warranty: WARRANTY_1Y,
    offer: { price: 429 },
    images: [{ svg: art.studioMic() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Turi", "Тип", "Dinamik", "Динамический"],
        ["Yoʻnalganlik", "Направленность", "Kardioid", "Кардиоида"],
        ["Chastota diapazoni", "Частотный диапазон", "50 Hz – 20 kHz", "50 Гц – 20 кГц"],
        ["Ulagich", "Разъём", "XLR"],
      ]),
    ],
    ageDays: 80,
  },
  {
    slug: "dji-osmo-pocket-3",
    cat: "cameras",
    brand: "dji",
    sku: "OP3",
    name: L("DJI Osmo Pocket 3"),
    tagline: L("Choʻntakdagi 1″ kamera.", "Камера 1″ в кармане."),
    description: L(
      "1 dyuymli CMOS sensor, 4K/120fps va 3 oʻqli mexanik stabilizatsiya. Aylanadigan 2″ OLED ekran bilan vlog va kontent yaratish oson.",
      "Сенсор CMOS 1″, 4K/120 к/с и 3-осевая механическая стабилизация. С поворотным OLED-экраном 2″ снимать влоги и контент проще простого.",
    ),
    warranty: WARRANTY_1Y,
    options: [
      textOption("kit", L("Komplekt", "Комплект"), [
        ["standard", "Standart", "Стандарт"],
        ["creator", "Creator Combo"],
      ]),
    ],
    variantOffer: (v) => (v.kit === "standard" ? { price: 569 } : { price: 719 }),
    images: [{ svg: art.gimbalCam() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Sensor", "Сенсор", "1″ CMOS"],
        ["Video", "Видео", "4K, 120 fps gacha", "4K, до 120 к/с"],
        ["Stabilizatsiya", "Стабилизация", "3 oʻqli mexanik", "3-осевая механическая"],
        ["Ekran", "Экран", "2″ OLED, aylanadigan", "2″ OLED, поворотный"],
      ]),
    ],
    isNew: true,
    ageDays: 10,
  },
  {
    slug: "sony-zv-e10-ii-kit",
    cat: "cameras",
    brand: "sony",
    sku: "ZVE10M2K",
    name: L("Sony ZV-E10 II + 16-50 mm", "Sony ZV-E10 II + 16-50 мм"),
    tagline: L("Kontent yaratuvchilar uchun.", "Для создателей контента."),
    description: L(
      "26 MP APS-C sensorli almashtiriladigan obyektivli kamera: 4K 60p 10-bit video, aylanadigan ekran va vlog uchun qulay funksiyalar. Komplektda E PZ 16-50 mm obyektiv.",
      "Беззеркальная камера с сенсором APS-C 26 МП: видео 4K 60p 10 бит, поворотный экран и удобные функции для влогов. В комплекте объектив E PZ 16-50 мм.",
    ),
    warranty: WARRANTY_1Y,
    offer: { price: 1149 },
    images: [{ svg: art.camera() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Sensor", "Сенсор", "26 MP APS-C Exmor R CMOS", "26 МП APS-C Exmor R CMOS"],
        ["Protsessor", "Процессор", "BIONZ XR"],
        ["Video", "Видео", "4K 60p, 10-bit 4:2:2", "4K 60p, 10 бит 4:2:2"],
        ["Ekran", "Экран", "Aylanadigan sensorli", "Поворотный сенсорный"],
        ["Obyektiv", "Объектив", "E PZ 16-50 mm F3.5-5.6 OSS II", "E PZ 16-50 мм F3.5-5.6 OSS II"],
      ]),
    ],
    ageDays: 55,
  },
  {
    slug: "sandisk-extreme-pro-sdxc",
    cat: "cards",
    brand: "sandisk",
    sku: "SDXPRO",
    name: L("SanDisk Extreme PRO SDXC UHS-I"),
    tagline: L("200 MB/s gacha. V30.", "До 200 МБ/с. V30."),
    description: L(
      "Upakovkadagi eng katta raqam — eng kerakli raqam emas. 200 MB/s — bu ideal sharoitdagi maksimum, kamera uchun esa minimal tezlik (V-klass) muhim. V30 4K video yozish uchun yetarli. Qaysi karta kerakligini bilmasangiz — birga tanlaymiz.",
      "Самая большая цифра на упаковке — не самая важная. 200 МБ/с — это максимум в идеальных условиях, а для камеры важна минимальная скорость (V-класс). V30 достаточно для записи 4K. Не знаете, какая карта нужна, — подберём вместе.",
    ),
    warranty: L("Umrbod cheklangan kafolat", "Пожизненная ограниченная гарантия"),
    options: [
      textOption("capacity", L("Sigʻim", "Объём"), [
        ["64", "64 GB", "64 ГБ"],
        ["128", "128 GB", "128 ГБ"],
        ["256", "256 GB", "256 ГБ"],
      ]),
    ],
    variantOffer: (v) => ({ "64": { price: 25 }, "128": { price: 39, oldPrice: 45 }, "256": { price: 69 } })[v.capacity] ?? { price: 25 },
    images: [{ svg: art.sdCard() }],
    specs: [
      group("main", L("Asosiy", "Основное"), [
        ["Oʻqish", "Чтение", "200 MB/s gacha", "До 200 МБ/с"],
        ["Yozish", "Запись", "90–140 MB/s gacha (sigʻimga qarab)", "До 90–140 МБ/с (зависит от объёма)"],
        ["Klass", "Класс", "UHS-I, U3, V30, Class 10"],
        ["Video", "Видео", "4K UHD"],
      ]),
    ],
    isHit: true,
    ageDays: 100,
  },
];

const CATEGORIES: Array<{
  key: string;
  slug: string;
  name: Localized;
  subtitle?: Localized;
  parent: string | null;
  inMenu: boolean;
  art: () => string;
}> = [
  { key: "apple", slug: "apple", name: L("Apple"), subtitle: L("Faqat rasmiy texnika", "Только официальная техника"), parent: null, inMenu: false, art: () => art.laptopOpen("#2e2e30") },
  { key: "iphone", slug: "iphone", name: L("iPhone"), subtitle: L("Pro, Air va boshqa modellar", "Pro, Air и другие модели"), parent: "apple", inMenu: true, art: () => art.phoneBack("#f2793a", "pro") },
  { key: "mac", slug: "mac", name: L("Mac"), subtitle: L("MacBook, iMac, Mac mini", "MacBook, iMac, Mac mini"), parent: "apple", inMenu: true, art: () => art.laptopOpen("#d6d7d9") },
  { key: "ipad", slug: "ipad", name: L("iPad"), parent: "apple", inMenu: true, art: () => art.tablet("#9fb7d6") },
  { key: "watch", slug: "apple-watch", name: L("Apple Watch"), parent: "apple", inMenu: true, art: () => art.watch("#cfc8bd", "#f08a3e") },
  { key: "airpods", slug: "airpods", name: L("AirPods"), parent: "apple", inMenu: true, art: () => art.headphones("#9cb4cb") },
  { key: "tv", slug: "tv-home", name: L("TV va uy", "ТВ и дом"), parent: "apple", inMenu: false, art: () => art.tvBox() },
  { key: "acc", slug: "apple-accessories", name: L("Aksessuarlar", "Аксессуары"), parent: "apple", inMenu: false, art: () => art.keyboard() },
  { key: "pc", slug: "pc", name: L("PC"), subtitle: L("Oʻyin, ish va ijod uchun yigʻamiz", "Собираем для игр, работы и творчества"), parent: null, inMenu: true, art: () => art.pcTower() },
  { key: "builds", slug: "pc-builds", name: L("Tayyor yigʻmalar", "Готовые сборки"), parent: "pc", inMenu: false, art: () => art.pcTower("#ff7a18", "#ffd166") },
  { key: "monitors", slug: "monitors", name: L("Monitorlar", "Мониторы"), parent: "pc", inMenu: false, art: () => art.monitor() },
  { key: "audio", slug: "audio", name: L("Audio", "Аудио"), subtitle: L("Mikrofonlar va studiya uskunalari", "Микрофоны и студийное оборудование"), parent: null, inMenu: true, art: () => art.studioMic() },
  { key: "video", slug: "video", name: L("Video", "Видео"), subtitle: L("Kameralar va xotira kartalari", "Камеры и карты памяти"), parent: null, inMenu: true, art: () => art.gimbalCam() },
  { key: "cameras", slug: "cameras", name: L("Kameralar", "Камеры"), parent: "video", inMenu: false, art: () => art.camera() },
  { key: "cards", slug: "memory-cards", name: L("Xotira kartalari", "Карты памяти"), parent: "video", inMenu: false, art: () => art.sdCard() },
];

const BRANDS: Array<[string, string]> = [
  ["apple", "Apple"],
  ["dell", "Dell"],
  ["dji", "DJI"],
  ["shure", "Shure"],
  ["sony", "Sony"],
  ["sandisk", "SanDisk"],
];

function writeSvg(uploadDir: string, content: string, w = 1200, h = 1200, color: string | null = null): ImageAsset {
  const id = `${Date.now().toString(36)}${crypto.randomBytes(5).toString("hex")}`;
  fs.writeFileSync(path.join(uploadDir, `${id}.svg`), content);
  return { id, w, h, sizes: [], ext: "svg", color };
}

/** Bump when the demo illustrations change; existing demo items then get the new art. */
const DEMO_ART_VERSION = "2";
const BANNER_SCENES: Record<string, "iphone" | "setup" | "imac"> = {
  "/product/iphone-17-pro": "iphone",
  "/catalog/mac": "setup",
  "/product/imac-24-m4-refurbished": "imac",
};

/**
 * Re-render the bundled SVG art of demo products, demo banners and seeded categories.
 * New file ids keep browsers from showing cached old pictures; uploaded photos are left alone.
 */
function refreshDemoArt(db: Database.Database, uploadDir: string): void {
  const current = db.prepare("SELECT value FROM kv WHERE key = 'demo_art'").get() as { value: string } | undefined;
  if (current?.value === DEMO_ART_VERSION) return;
  const stale: string[] = [];
  const replace = (asset: ImageAsset, content: string): ImageAsset => {
    if (asset.ext !== "svg") return asset;
    stale.push(`${asset.id}.svg`);
    const [, , w, h] = (/viewBox="([^"]+)"/.exec(content)?.[1] ?? "0 0 1200 1200").split(" ").map(Number);
    return writeSvg(uploadDir, content, w, h, asset.color ?? null);
  };
  const parse = <T,>(json: string | null): T | null => {
    try {
      return json ? (JSON.parse(json) as T) : null;
    } catch {
      return null;
    }
  };

  db.transaction(() => {
    const products = db.prepare("SELECT id, slug, images FROM products WHERE is_demo = 1").all() as {
      id: number;
      slug: string;
      images: string;
    }[];
    for (const row of products) {
      const def = PRODUCTS.find((p) => p.slug === row.slug);
      const images = parse<ImageAsset[]>(row.images);
      if (!def || !images) continue;
      const next = images.map((img, i) => (def.images[i] ? replace(img, def.images[i].svg) : img));
      db.prepare("UPDATE products SET images = ? WHERE id = ?").run(JSON.stringify(next), row.id);
    }
    const categories = db.prepare("SELECT id, slug, image FROM categories").all() as { id: number; slug: string; image: string | null }[];
    for (const row of categories) {
      const def = CATEGORIES.find((c) => c.slug === row.slug);
      const image = parse<ImageAsset>(row.image);
      if (!def || !image) continue;
      db.prepare("UPDATE categories SET image = ? WHERE id = ?").run(JSON.stringify(replace(image, def.art())), row.id);
    }
    const banners = db.prepare("SELECT id, link, image FROM banners WHERE is_demo = 1").all() as {
      id: number;
      link: string;
      image: string | null;
    }[];
    for (const row of banners) {
      const kind = BANNER_SCENES[row.link];
      const image = parse<ImageAsset>(row.image);
      if (!kind || !image) continue;
      db.prepare("UPDATE banners SET image = ? WHERE id = ?").run(JSON.stringify(replace(image, art.bannerScene(kind))), row.id);
    }
    db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES ('demo_art', ?)").run(DEMO_ART_VERSION);
  })();
  for (const file of stale) fs.rmSync(path.join(uploadDir, file), { force: true });
}

/** Fill a brand-new database with store settings, catalog structure and demo items. */
export function seedDatabase(db: Database.Database, uploadDir: string): void {
  if (db.prepare("SELECT 1 FROM kv WHERE key = 'seeded'").get()) {
    refreshDemoArt(db, uploadDir);
    return;
  }
  const withDemo = process.env.SEED_DEMO !== "0";
  fs.mkdirSync(uploadDir, { recursive: true });

  db.transaction(() => {
    db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES ('site', ?)").run(JSON.stringify(DEFAULT_SETTINGS));

    const brandIds = new Map<string, number>();
    BRANDS.forEach(([slug, name], i) => {
      const res = db.prepare("INSERT INTO brands (slug, name, sort) VALUES (?, ?, ?)").run(slug, name, i * 10);
      brandIds.set(slug, Number(res.lastInsertRowid));
    });

    const catIds = new Map<string, number>();
    const catNames = new Map<string, Localized>();
    CATEGORIES.forEach((c, i) => {
      const image = withDemo ? writeSvg(uploadDir, c.art()) : null;
      const res = db
        .prepare(
          "INSERT INTO categories (parent_id, slug, name_uz, name_ru, subtitle_uz, subtitle_ru, image, sort, in_menu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          c.parent ? catIds.get(c.parent) ?? null : null,
          c.slug,
          c.name.uz,
          c.name.ru,
          c.subtitle?.uz ?? "",
          c.subtitle?.ru ?? "",
          image ? JSON.stringify(image) : null,
          i * 10,
          c.inMenu ? 1 : 0,
        );
      catIds.set(c.key, Number(res.lastInsertRowid));
      catNames.set(c.key, c.name);
    });

    if (!withDemo) return;

    PRODUCTS.forEach((p, index) => {
      const options = p.options ?? [];
      let n = 0;
      const variants: ProductVariant[] = buildVariants(
        options,
        [],
        { price: 0, oldPrice: null, stock: "in_stock" },
        () => `v${++n}`,
      ).map((v) => {
        const offer = p.variantOffer?.(v.values) ?? { price: 0 };
        return { ...v, price: offer.price, oldPrice: offer.oldPrice ?? null, stock: offer.stock ?? "in_stock" };
      });
      const base = p.offer ?? variants[0] ?? { price: 0 };
      const images = p.images.map((img) => writeSvg(uploadDir, img.svg, 1200, 1200, img.color ?? null));
      const draft = {
        options,
        variants,
        price: base.price,
        oldPrice: base.oldPrice ?? null,
        stock: (base.stock ?? "in_stock") as StockStatus,
      };
      const derived = deriveProduct(draft);
      const brandName = BRANDS.find(([slug]) => slug === p.brand)?.[1] ?? "";
      const cat = catNames.get(p.cat);
      const searchText = searchNormalize(
        [
          p.name.uz,
          p.name.ru,
          p.tagline.uz,
          p.tagline.ru,
          brandName,
          p.sku ?? "",
          cat?.uz ?? "",
          cat?.ru ?? "",
          ...options.flatMap((o) => o.values.flatMap((v) => [v.label.uz, v.label.ru])),
        ].join(" "),
      );
      db.prepare(
        `INSERT INTO products (slug, category_id, brand_id, sku, name_uz, name_ru, tagline_uz, tagline_ru,
          description_uz, description_ru, warranty_uz, warranty_ru, condition, price, old_price, stock,
          images, options, variants, specs, is_new, is_hit, is_featured, status, sort,
          min_price, max_price, min_old_price, discount_pct, in_stock, search_text, is_demo, created_at, updated_at)
         VALUES (@slug, @category_id, @brand_id, @sku, @name_uz, @name_ru, @tagline_uz, @tagline_ru,
          @description_uz, @description_ru, @warranty_uz, @warranty_ru, @condition, @price, @old_price, @stock,
          @images, @options, @variants, @specs, @is_new, @is_hit, @is_featured, 'published', @sort,
          @min_price, @max_price, @min_old_price, @discount_pct, @in_stock, @search_text, 1,
          datetime('now', @age), datetime('now', @age))`,
      ).run({
        slug: p.slug,
        category_id: catIds.get(p.cat) ?? null,
        brand_id: (p.brand && brandIds.get(p.brand)) || null,
        sku: p.sku ?? "",
        name_uz: p.name.uz,
        name_ru: p.name.ru,
        tagline_uz: p.tagline.uz,
        tagline_ru: p.tagline.ru,
        description_uz: p.description.uz,
        description_ru: p.description.ru,
        warranty_uz: p.warranty.uz,
        warranty_ru: p.warranty.ru,
        condition: p.condition ?? "new",
        price: draft.price,
        old_price: draft.oldPrice,
        stock: draft.stock,
        images: JSON.stringify(images),
        options: JSON.stringify(options),
        variants: JSON.stringify(variants),
        specs: JSON.stringify(p.specs),
        is_new: p.isNew ? 1 : 0,
        is_hit: p.isHit ? 1 : 0,
        is_featured: p.isFeatured ? 1 : 0,
        sort: index * 10,
        min_price: derived.minPrice,
        max_price: derived.maxPrice,
        min_old_price: derived.minOldPrice,
        discount_pct: derived.discountPct,
        in_stock: derived.inStock ? 1 : 0,
        search_text: searchText,
        age: `-${p.ageDays} days`,
      });
    });

    const banners = [
      {
        title: L("iPhone 17 Pro"),
        subtitle: L("Uchta 48 MP kamera. A19 Pro chipi. Endi sotuvda.", "Три камеры 48 МП. Чип A19 Pro. Уже в продаже."),
        button: L("Batafsil", "Подробнее"),
        link: "/product/iphone-17-pro",
        scene: art.bannerScene("iphone"),
        theme: "dark",
        bg: "#0b0b0f",
        accent: "#ff7a1a",
      },
      {
        title: L("AI bilan ishlash uchun setup", "Сетап для работы с AI"),
        subtitle: L(
          "Mac mini M5 Pro, Studio Display, Magic Keyboard va Trackpad — toʻliq ish joyi bir buyurtmada.",
          "Mac mini M5 Pro, Studio Display, Magic Keyboard и Trackpad — готовое рабочее место одним заказом.",
        ),
        button: L("Setupni koʻrish", "Смотреть сетап"),
        link: "/catalog/mac",
        scene: art.bannerScene("setup"),
        theme: "light",
        bg: "#f1f1f3",
        accent: "#8b5cff",
      },
      {
        title: L("iMac M4 — 200 $ arzonroq", "iMac M4 — на 200 $ дешевле"),
        subtitle: L(
          "Apple Certified Refurbished: Apple tekshirgan, 1 yillik rasmiy kafolat bilan.",
          "Apple Certified Refurbished: проверен Apple, официальная гарантия 1 год.",
        ),
        button: L("Narxini koʻrish", "Смотреть цену"),
        link: "/product/imac-24-m4-refurbished",
        scene: art.bannerScene("imac"),
        theme: "light",
        bg: "#e3eefb",
        accent: "#3d8bff",
      },
    ];
    banners.forEach((b, i) => {
      const [, , vw, vh] = (/viewBox="([^"]+)"/.exec(b.scene)?.[1] ?? "0 0 1600 1000").split(" ").map(Number);
      const image = writeSvg(uploadDir, b.scene, vw, vh);
      db.prepare(
        `INSERT INTO banners (title_uz, title_ru, subtitle_uz, subtitle_ru, button_uz, button_ru, link, image, theme, bg, accent, sort, is_demo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      ).run(
        b.title.uz,
        b.title.ru,
        b.subtitle.uz,
        b.subtitle.ru,
        b.button.uz,
        b.button.ru,
        b.link,
        JSON.stringify(image),
        b.theme,
        b.bg,
        b.accent,
        i * 10,
      );
    });
  })();

  db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES ('seeded', datetime('now'))").run();
  db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES ('demo_art', ?)").run(DEMO_ART_VERSION);
}
