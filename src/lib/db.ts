import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "./seed";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export type DB = Database.Database;

/** Each entry upgrades the schema by one version (PRAGMA user_version). */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    name_uz TEXT NOT NULL,
    name_ru TEXT NOT NULL DEFAULT '',
    image TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    in_menu INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    logo TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    sku TEXT NOT NULL DEFAULT '',
    name_uz TEXT NOT NULL,
    name_ru TEXT NOT NULL DEFAULT '',
    tagline_uz TEXT NOT NULL DEFAULT '',
    tagline_ru TEXT NOT NULL DEFAULT '',
    description_uz TEXT NOT NULL DEFAULT '',
    description_ru TEXT NOT NULL DEFAULT '',
    warranty_uz TEXT NOT NULL DEFAULT '',
    warranty_ru TEXT NOT NULL DEFAULT '',
    condition TEXT NOT NULL DEFAULT 'new',
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    stock TEXT NOT NULL DEFAULT 'in_stock',
    images TEXT NOT NULL DEFAULT '[]',
    options TEXT NOT NULL DEFAULT '[]',
    variants TEXT NOT NULL DEFAULT '[]',
    specs TEXT NOT NULL DEFAULT '[]',
    is_new INTEGER NOT NULL DEFAULT 0,
    is_hit INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    sort INTEGER NOT NULL DEFAULT 0,
    min_price REAL NOT NULL DEFAULT 0,
    max_price REAL NOT NULL DEFAULT 0,
    min_old_price REAL,
    discount_pct INTEGER NOT NULL DEFAULT 0,
    in_stock INTEGER NOT NULL DEFAULT 1,
    search_text TEXT NOT NULL DEFAULT '',
    views INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_products_category ON products(category_id);
  CREATE INDEX idx_products_brand ON products(brand_id);
  CREATE INDEX idx_products_status ON products(status, sort);
  CREATE INDEX idx_products_price ON products(min_price);

  CREATE TABLE banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_uz TEXT NOT NULL DEFAULT '',
    title_ru TEXT NOT NULL DEFAULT '',
    subtitle_uz TEXT NOT NULL DEFAULT '',
    subtitle_ru TEXT NOT NULL DEFAULT '',
    button_uz TEXT NOT NULL DEFAULT '',
    button_ru TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '',
    image TEXT,
    image_mobile TEXT,
    theme TEXT NOT NULL DEFAULT 'light',
    bg TEXT NOT NULL DEFAULT '#F5F5F7',
    sort INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    product_id INTEGER,
    product_name TEXT NOT NULL DEFAULT '',
    variant TEXT NOT NULL DEFAULT '',
    page_url TEXT NOT NULL DEFAULT '',
    locale TEXT NOT NULL DEFAULT 'uz',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_leads_status ON leads(status, created_at);
  `,
  // v2: orders vs callback requests; short category subtitles for the homepage tiles.
  `
  ALTER TABLE leads ADD COLUMN kind TEXT NOT NULL DEFAULT 'callback';
  ALTER TABLE categories ADD COLUMN subtitle_uz TEXT NOT NULL DEFAULT '';
  ALTER TABLE categories ADD COLUMN subtitle_ru TEXT NOT NULL DEFAULT '';
  UPDATE categories SET subtitle_uz = 'Faqat rasmiy texnika', subtitle_ru = 'Только официальная техника' WHERE slug = 'apple' AND subtitle_uz = '';
  UPDATE categories SET subtitle_uz = 'Oʻyin, ish va ijod uchun yigʻamiz', subtitle_ru = 'Собираем для игр, работы и творчества' WHERE slug = 'pc' AND subtitle_uz = '';
  UPDATE categories SET subtitle_uz = 'Mikrofonlar va studiya uskunalari', subtitle_ru = 'Микрофоны и студийное оборудование' WHERE slug = 'audio' AND subtitle_uz = '';
  UPDATE categories SET subtitle_uz = 'Kameralar va xotira kartalari', subtitle_ru = 'Камеры и карты памяти' WHERE slug = 'video' AND subtitle_uz = '';
  `,
  // v3: glow color of each hero slide.
  `
  ALTER TABLE banners ADD COLUMN accent TEXT NOT NULL DEFAULT '';
  UPDATE banners SET accent = '#ff7a1a' WHERE link = '/product/iphone-17-pro' AND accent = '';
  UPDATE banners SET accent = '#8b5cff' WHERE link = '/catalog/mac' AND accent = '';
  UPDATE banners SET accent = '#3d8bff' WHERE link = '/product/imac-24-m4-refurbished' AND accent = '';
  `,
];

function migrate(db: DB) {
  const version = db.pragma("user_version", { simple: true }) as number;
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

function open(): DB {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "store.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  seedDatabase(db, UPLOAD_DIR);
  return db;
}

declare global {
  var __productDb: DB | undefined;
}

/** One shared connection per server process (survives dev hot reloads). */
export function getDb(): DB {
  if (!globalThis.__productDb) globalThis.__productDb = open();
  return globalThis.__productDb;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
