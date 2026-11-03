export const LOCALES = ["uz", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "uz" || value === "ru";
}

export type Localized = { uz: string; ru: string };

/** A processed image stored under DATA_DIR/uploads. */
export type ImageAsset = {
  id: string;
  /** Intrinsic size of the largest stored rendition. */
  w: number;
  h: number;
  /** Available widths for `srcset`; empty for vector images. */
  sizes: number[];
  ext: "webp" | "svg";
  /** Option value id this photo belongs to (color-specific galleries). */
  color?: string | null;
};

export type StockStatus = "in_stock" | "preorder" | "soon" | "out_of_stock";
export const STOCK_STATUSES: StockStatus[] = ["in_stock", "preorder", "soon", "out_of_stock"];

export type Condition = "new" | "refurbished" | "used";
export const CONDITIONS: Condition[] = ["new", "refurbished", "used"];

export type OptionValue = { id: string; label: Localized; hex?: string };
export type ProductOption = {
  id: string;
  name: Localized;
  kind: "color" | "text";
  values: OptionValue[];
};
export type ProductVariant = {
  id: string;
  /** optionId -> valueId */
  values: Record<string, string>;
  price: number;
  oldPrice: number | null;
  stock: StockStatus;
  enabled: boolean;
};

export type SpecItem = { label: Localized; value: Localized };
export type SpecGroup = { id: string; title: Localized; items: SpecItem[] };

export type Category = {
  id: number;
  parentId: number | null;
  slug: string;
  name: Localized;
  subtitle: Localized;
  image: ImageAsset | null;
  sort: number;
  isActive: boolean;
  inMenu: boolean;
};

export type Brand = {
  id: number;
  slug: string;
  name: string;
  logo: ImageAsset | null;
  sort: number;
};

export type ProductStatus = "published" | "draft";

export type Product = {
  id: number;
  slug: string;
  categoryId: number | null;
  brandId: number | null;
  sku: string;
  name: Localized;
  tagline: Localized;
  description: Localized;
  warranty: Localized;
  condition: Condition;
  price: number;
  oldPrice: number | null;
  stock: StockStatus;
  images: ImageAsset[];
  options: ProductOption[];
  variants: ProductVariant[];
  specs: SpecGroup[];
  isNew: boolean;
  isHit: boolean;
  isFeatured: boolean;
  status: ProductStatus;
  sort: number;
  minPrice: number;
  maxPrice: number;
  minOldPrice: number | null;
  discountPct: number;
  inStock: boolean;
  views: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Banner = {
  id: number;
  title: Localized;
  subtitle: Localized;
  button: Localized;
  link: string;
  image: ImageAsset | null;
  imageMobile: ImageAsset | null;
  theme: "light" | "dark";
  bg: string;
  /** Glow color of the hero stage ("" = brand orange). */
  accent: string;
  sort: number;
  isActive: boolean;
  isDemo: boolean;
};

export type LeadStatus = "new" | "done";
export type LeadKind = "order" | "callback";
/** Lead inbox snapshot pushed to open admin tabs; any change in it means the inbox changed. */
export type InboxState = {
  newCount: number;
  total: number;
  lastId: number;
  /** The most recent lead, for the "new order" toast in the admin panel. */
  latest: { id: number; kind: LeadKind; name: string; phone: string; productName: string } | null;
};

export type Lead = {
  id: number;
  kind: LeadKind;
  name: string;
  phone: string;
  message: string;
  productId: number | null;
  productName: string;
  variant: string;
  pageUrl: string;
  locale: Locale;
  status: LeadStatus;
  createdAt: string;
};

export type Currency = "USD" | "UZS";
export type CurrencyDisplay = "UZS" | "USD" | "both";

export type SiteSettings = {
  storeName: string;
  tagline: Localized;
  about: Localized;
  phones: string[];
  email: string;
  telegramUser: string;
  telegramChannel: string;
  instagram: string;
  youtube: string;
  address: Localized;
  landmark: Localized;
  workHours: Localized;
  map: { lat: number; lng: number; zoom: number };
  currency: { base: Currency; display: CurrencyDisplay; rate: number; roundTo: number };
  installment: { enabled: boolean; months: number; markup: number };
  announcement: { enabled: boolean; text: Localized; link: string };
  telegramBot: { token: string; chatId: string };
  seo: { title: Localized; description: Localized };
};
