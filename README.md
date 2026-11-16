# Online catalog (no-name demo)

A bilingual (Uzbek / Russian) online catalog and admin panel for a sample electronics store that belongs to no one: it is called "LOGO" and all of its data is fake.
The site shows products, prices (the old price is struck through on sale items), photos, specifications,
contact numbers and the store address on a map. There is no online payment: customers call,
write on Telegram, send an order request or ask for a callback.

---

## Features

**Storefront**
- Home page: banner slider, categories (with "from …" prices), sale items, new arrivals, bestsellers, a "How we work" block and a store block with a map.
- Catalog: categories and subcategories, filters (brand, price range, in stock, on sale, condition), sorting, pagination.
- Product page: photo gallery with zoom; variants (color, storage, configuration), each with its own price; the old price struck through with the amount saved; availability, a specifications table, description and similar products.
- "Order" form, "Call", "Write on Telegram" (a ready message with the product name and link) and a callback form.
- Instant search (understands Latin and Cyrillic spellings such as "айфон" or "makbuk"), favorites, recently viewed.
- Two languages: `/uz/...` and `/ru/...`, chosen automatically from the browser language.
- Mobile layout with a bottom navigation bar.
- SEO: sitemap.xml, robots.txt, Open Graph, product and store data for Google (JSON-LD).

**Admin panel (`/admin`)**
- Adding and editing products: name and description in both languages; photos (drag and drop, reordering, linking to a color); price and old (struck-through) price; quick discount buttons (−5%…−30%); a variants table; specifications (ready templates and copying from another product); New / Bestseller / Recommended badges; draft mode; a live preview of how the product looks on the site.
- Product list: search, filters, hiding or deleting several products at once, duplicating.
- Categories (2 levels), brands, banners.
- Requests ("Soʻrovlar"): orders and callback requests appear live, without reloading the page; optionally they also go to a Telegram bot.
- Settings: contacts, address and map, working hours, currency (prices entered in dollars and shown in soums, with the Central Bank rate fetched in one click), installment note, announcement bar, SEO, password.

---

## Running locally

Requires **Node.js 22 or newer** (24 recommended).

```bash
npm install
cp .env.example .env.local   # then change ADMIN_PASSWORD in .env.local
npm run dev
```

- Site: http://localhost:3000
- Admin panel: http://localhost:3000/admin (password: `ADMIN_PASSWORD` from `.env.local`)

On the first start the database (`data/store.db`) is created automatically and filled with **demo products**,
so the design does not look empty. Once your own products are in, remove the demos with the
**Admin → Sozlamalar → Maʼlumotlar → "Demolarni oʻchirish"** (Settings → Data → Delete demos) button;
categories and brands stay. If you do not want demo data at all, add `SEED_DEMO=0` to `.env` before the first start.

---

## Working in the admin panel

The admin panel is in Uzbek; button and section names are quoted below as they appear there.

1. **Adding a product:** Mahsulotlar → "Yangi mahsulot" (Products → New product). Enter the name, upload photos, set the price.
   - **Discount:** put the previous price into "Eski narx" (Old price). The site strikes it through, shows the new price in red and adds a "−15%" badge. Or press one of the "Tez chegirma" (Quick discount) buttons.
   - With **price 0** the site shows "Narxini soʻrang" (Ask for the price).
   - **Variants:** add values with buttons such as "+ Rang" (Color) and "+ Xotira" (Storage). The table then gets a separate price, old price and status for every combination. Photos linked to a color are shown when the customer picks that color.
   - Saving: the "Saqlash" (Save) button or `⌘/Ctrl + S`.
2. **Currency:** by default prices are entered in dollars and shown in soums on the site. When the rate changes, use **Sozlamalar → Narx va valyuta → "MB kursini olish"** (Settings → Price and currency → Get the Central Bank rate), then "Saqlash"; all prices update automatically.
3. **Banners:** the home page slider. If a banner has a title, the text goes on the left and the image on the right; for a ready-made banner image, leave the title empty.
4. **Telegram notifications:** Sozlamalar → Telegram bildirishnomalar (Settings → Telegram notifications); the instructions are on that page. After that every new request reaches Telegram right away.

> Check these before launch: working hours (currently "Har kuni 10:00 – 21:00", i.e. daily 10:00–21:00), the dollar rate and the prices and specifications of the demo products. They are all sample values.

---

## Deploying to a server (VPS)

**The easiest way is a free Oracle Cloud server:** see the step-by-step guide in [deploy/ORACLE.md](deploy/ORACLE.md).
Preparing the server and uploading the site is one command: `./deploy/deploy.sh ubuntu@SERVER_IP key.key`
(it works on any Ubuntu 24.04 VPS as well). Manual setup options follow.

The site runs as a plain Node.js server; all data is in one folder (`data/`: the SQLite database and photos).
No external services or paid databases are needed.

### Option 1: Docker

```bash
cp .env.example .env.production   # ADMIN_PASSWORD, SESSION_SECRET, SITE_URL=https://example.uz
docker compose up -d --build
```

### Option 2: Node.js + PM2

```bash
npm ci
npm run build
npm install -g pm2
pm2 start npm --name productstore -- start
pm2 save
```

### Nginx (domain and HTTPS)

```nginx
server {
    server_name example.uz www.example.uz;
    client_max_body_size 25m;          # for photo uploads (the default 1 MB is not enough)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL: `sudo certbot --nginx -d example.uz -d www.example.uz`.
The requests page in the admin panel updates live (Server-Sent Events, `/api/admin/leads/stream`). Nginx needs no extra settings for this: the response sets `X-Accel-Buffering: no` and the server pings the connection every 25 seconds.
In production, `.env` must contain `SITE_URL=https://example.uz` (used by the sitemap and social sharing links).

### Backups

All data is in the `data/` folder (or `DATA_DIR`). Copy it regularly, for example:

```bash
tar czf backup-$(date +%F).tar.gz data/
```

### Forgotten password

```bash
npm run reset-password
```

After that, sign in with `ADMIN_PASSWORD` from `.env.local` (or `.env.production`).

---

## Technical notes

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- SQLite (`better-sqlite3`); photos are converted to WebP with `sharp` (in several sizes)
- Structure: `src/app/(site)/[locale]` — storefront, `src/app/(admin)/admin` — admin panel, `src/lib` — data layer, `src/components` — UI
- Translations: `src/lib/i18n/uz.ts`, `src/lib/i18n/ru.ts`
