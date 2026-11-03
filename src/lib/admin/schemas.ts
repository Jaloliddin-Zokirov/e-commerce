import { z } from "zod";
import { CONDITIONS, STOCK_STATUSES } from "../types";

const text = (max: number) => z.string().trim().max(max);
export const localized = (max: number) => z.object({ uz: text(max), ru: text(max) });

export const imageAsset = z.object({
  id: z.string().regex(/^[a-z0-9]+$/),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  sizes: z.array(z.number().int().positive()).max(10),
  ext: z.enum(["webp", "svg"]),
  color: z.string().max(40).nullable().optional(),
});

const money = z.number().min(0).max(1e12);
const stock = z.enum(STOCK_STATUSES as [string, ...string[]]);
const id = z.string().trim().min(1).max(40);

export const productInput = z.object({
  slug: z.string().trim().max(90),
  categoryId: z.number().int().positive().nullable(),
  brandId: z.number().int().positive().nullable(),
  sku: text(60),
  name: localized(200),
  tagline: localized(200),
  description: localized(20000),
  warranty: localized(120),
  condition: z.enum(CONDITIONS as [string, ...string[]]),
  price: money,
  oldPrice: money.nullable(),
  stock,
  images: z.array(imageAsset).max(40),
  options: z
    .array(
      z.object({
        id,
        name: localized(60),
        kind: z.enum(["color", "text"]),
        values: z
          .array(z.object({ id, label: localized(80), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }))
          .max(40),
      }),
    )
    .max(4),
  variants: z
    .array(
      z.object({
        id,
        values: z.record(z.string(), z.string()),
        price: money,
        oldPrice: money.nullable(),
        stock,
        enabled: z.boolean(),
      }),
    )
    .max(400),
  specs: z
    .array(
      z.object({
        id,
        title: localized(120),
        items: z.array(z.object({ label: localized(120), value: localized(500) })).max(120),
      }),
    )
    .max(40),
  isNew: z.boolean(),
  isHit: z.boolean(),
  isFeatured: z.boolean(),
  status: z.enum(["published", "draft"]),
  sort: z.number().int().min(-100000).max(100000),
});

export const categoryInput = z.object({
  parentId: z.number().int().positive().nullable(),
  slug: z.string().trim().max(90),
  name: localized(120),
  subtitle: localized(160),
  image: imageAsset.nullable(),
  sort: z.number().int(),
  isActive: z.boolean(),
  inMenu: z.boolean(),
});

export const bannerInput = z.object({
  title: localized(160),
  subtitle: localized(300),
  button: localized(60),
  link: z.string().trim().max(500),
  image: imageAsset.nullable(),
  imageMobile: imageAsset.nullable(),
  theme: z.enum(["light", "dark"]),
  bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^(#[0-9a-fA-F]{6})?$/),
  sort: z.number().int(),
  isActive: z.boolean(),
});

const url = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Havola http:// yoki https:// bilan boshlanishi kerak");

export const settingsInput = z.object({
  storeName: z.string().trim().min(1).max(60),
  tagline: localized(160),
  about: localized(5000),
  phones: z.array(z.string().trim().min(5).max(40)).max(6),
  email: z.string().trim().max(120),
  telegramUser: z.string().trim().max(80),
  telegramChannel: url,
  instagram: url,
  youtube: url,
  address: localized(300),
  landmark: localized(200),
  workHours: localized(160),
  map: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    zoom: z.number().int().min(3).max(19),
  }),
  currency: z.object({
    base: z.enum(["USD", "UZS"]),
    display: z.enum(["UZS", "USD", "both"]),
    rate: z.number().positive().max(1_000_000),
    roundTo: z.number().int().min(1).max(1_000_000),
  }),
  installment: z.object({
    enabled: z.boolean(),
    months: z.number().int().min(2).max(60),
    markup: z.number().min(0).max(300),
  }),
  announcement: z.object({ enabled: z.boolean(), text: localized(200), link: z.string().trim().max(300) }),
  telegramBot: z.object({ token: z.string().trim().max(120), chatId: z.string().trim().max(60) }),
  seo: z.object({ title: localized(160), description: localized(400) }),
});

/** First message of every issue keyed by dotted path, e.g. "name.uz". */
export function issuesToErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
