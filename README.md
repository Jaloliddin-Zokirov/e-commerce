# PRODUCT — online katalog (productstore.uz)

**PRODUCT** doʻkoni uchun ikki tilli (oʻzbekcha / ruscha) online katalog va admin panel.
Saytda mahsulotlar, narxlar (chegirmada eski narx ustidan chizilgan), rasmlar, xarakteristikalar,
aloqa raqamlari va xaritadagi manzil koʻrinadi. Onlayn toʻlov yoʻq — mijoz qoʻngʻiroq qiladi,
Telegramda yozadi yoki «Qayta qoʻngʻiroq» soʻrovini qoldiradi.

---

## Imkoniyatlar

**Sayt (mijozlar uchun)**
- Bosh sahifa: banner-slayder, kategoriyalar («… dan» narxlari bilan), chegirmalar, yangi kelganlar, xitlar, «Professional yondashuv» bloki, xaritali doʻkon bloki.
- Katalog: kategoriya va boʻlimlar, filtrlar (brend, narx oraligʻi, sotuvda borlari, chegirmadagilar, holati), saralash, sahifalash.
- Mahsulot sahifasi: rasm galereyasi (kattalashtirish bilan), variantlar (rang, xotira, konfiguratsiya) — har biri oʻz narxi bilan, eski narx chizilgan + «Tejaysiz» summasi, mavjudlik holati, xarakteristikalar jadvali, tavsif, oʻxshash mahsulotlar.
- «Qoʻngʻiroq qilish», «Telegramda yozish» (mahsulot nomi va havolasi bilan tayyor xabar), «Qayta qoʻngʻiroq» formasi.
- Tezkor qidiruv (lotin/kirill, «айфон», «makbuk» kabi yozuvlarni ham tushunadi), sevimlilar, yaqinda koʻrilganlar.
- Ikki til: `/uz/...` va `/ru/...`, brauzer tiliga qarab avtomatik tanlanadi.
- Telefon uchun moslashgan dizayn, pastki navigatsiya paneli.
- SEO: sitemap.xml, robots.txt, Open Graph, Google uchun mahsulot/doʻkon maʼlumotlari (JSON-LD).

**Admin panel (`/admin`)**
- Mahsulot qoʻshish/tahrirlash: nom va tavsif ikki tilda, rasmlar (sudrab tashlash, tartiblash, rangga biriktirish), narx, eski (chizilgan) narx, tez chegirma tugmalari (−5%…−30%), variantlar jadvali, xarakteristikalar (tayyor shablonlar va boshqa mahsulotdan nusxalash), «Yangi / Xit / Tavsiya» belgilari, qoralama rejimi, saytda qanday koʻrinishining jonli namunasi.
- Mahsulotlar roʻyxati: qidiruv, filtrlar, bir nechtasini birdan yashirish/oʻchirish, nusxa yaratish.
- Kategoriyalar (2 daraja), brendlar, bannerlar.
- Soʻrovlar: «Buyurtma berish» va «Qayta qoʻngʻiroq» murojaatlari — sahifani yangilamasdan jonli paydo boʻladi; ixtiyoriy ravishda Telegram-botga ham xabar.
- Sozlamalar: aloqa, manzil va xarita, ish vaqti, valyuta (dollarda kiritib soʻmda koʻrsatish, Markaziy bank kursini bir tugmada olish), muddatli toʻlov yozuvi, eʼlon paneli, SEO, parol.

---

## Kompyuterda ishga tushirish

Talab: **Node.js 22 yoki yangiroq** (tavsiya: 24).

```bash
npm install
cp .env.example .env.local   # keyin .env.local ichida ADMIN_PASSWORD ni oʻzgartiring
npm run dev
```

- Sayt: http://localhost:3000
- Admin panel: http://localhost:3000/admin (parol — `.env.local` dagi `ADMIN_PASSWORD`)

Birinchi ishga tushirishda baza (`data/store.db`) avtomatik yaratiladi va **demo mahsulotlar** qoʻshiladi —
dizayn boʻsh koʻrinmasligi uchun. Oʻz mahsulotlaringizni qoʻshgach, ularni
**Admin → Sozlamalar → Maʼlumotlar → «Demolarni oʻchirish»** tugmasi bilan olib tashlang
(kategoriyalar va brendlar qoladi). Demo umuman kerak boʻlmasa, birinchi ishga tushirishdan oldin `.env` ga `SEED_DEMO=0` yozing.

---

## Admin panelda ishlash

1. **Mahsulot qoʻshish:** Mahsulotlar → «Yangi mahsulot». Nomini yozing, rasm yuklang, narxni kiriting.
   - **Chegirma:** «Eski narx» maydoniga avvalgi narxni yozing — saytda u ustidan chiziladi, yangi narx qizil boʻladi va «−15%» belgisi chiqadi. Yoki «Tez chegirma» tugmalaridan birini bosing.
   - **Narx 0** boʻlsa, saytda «Narxini soʻrang» yoziladi.
   - **Variantlar:** «+ Rang», «+ Xotira» kabi tugmalar bilan qiymatlar qoʻshing — jadvalda har bir kombinatsiya uchun alohida narx, eski narx va holat belgilanadi. Rasmlarga rang biriktirsangiz, mijoz rangni tanlaganda shu rasmlar chiqadi.
   - Saqlash: «Saqlash» tugmasi yoki `⌘/Ctrl + S`.
2. **Valyuta:** narxlar standart boʻyicha dollarda kiritiladi va saytda soʻmda koʻrsatiladi. Kurs oʻzgarsa, **Sozlamalar → Narx va valyuta → «MB kursini olish»** → «Saqlash» — barcha narxlar avtomatik yangilanadi.
3. **Bannerlar:** bosh sahifadagi slayder. Sarlavha yozilsa matn chapda, rasm oʻngda chiqadi; tayyor dizayndagi rasm boʻlsa, sarlavhani boʻsh qoldiring.
4. **Telegram xabarnoma:** Sozlamalar → Telegram bildirishnomalar (yoʻriqnoma oʻsha yerda). Shundan soʻng har bir yangi soʻrov darhol Telegramga keladi.

> Tekshirib chiqing: ish vaqti (hozir «Har kuni 10:00 – 21:00» deb yozilgan), dollar kursi va demo mahsulotlarning narx/xarakteristikalari — bular namuna sifatida kiritilgan.

---

## Serverga joylash (VPS)

**Eng oson yoʻl — tekin Oracle Cloud serveri:** bosqichma-bosqich yoʻriqnoma [deploy/ORACLE.md](deploy/ORACLE.md) da.
Serverni tayyorlash va saytni yuklash bitta buyruq bilan bajariladi: `./deploy/deploy.sh ubuntu@SERVER_IP kalit.key`
(istalgan Ubuntu 24.04 VPS'da ham ishlaydi). Quyida qoʻlda oʻrnatish variantlari.

Sayt oddiy Node.js server sifatida ishlaydi; maʼlumotlar bitta papkada (`data/`: SQLite baza + rasmlar).
Tashqi xizmat yoki pullik maʼlumotlar bazasi kerak emas.

### 1-variant: Docker

```bash
cp .env.example .env.production   # ADMIN_PASSWORD, SESSION_SECRET, SITE_URL=https://productstore.uz
docker compose up -d --build
```

### 2-variant: Node.js + PM2

```bash
npm ci
npm run build
npm install -g pm2
pm2 start npm --name productstore -- start
pm2 save
```

### Nginx (domen va HTTPS)

```nginx
server {
    server_name productstore.uz www.productstore.uz;
    client_max_body_size 25m;          # rasm yuklash uchun (standart 1 MB yetmaydi)

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

SSL: `sudo certbot --nginx -d productstore.uz -d www.productstore.uz`.
Admin paneldagi «Soʻrovlar» jonli yangilanadi (Server-Sent Events, `/api/admin/leads/stream`); bu uchun nginx'da qoʻshimcha sozlama shart emas — javobda `X-Accel-Buffering: no` bor va server har 25 soniyada aloqani tekshirib turadi.
Productionda `.env` dagi `SITE_URL=https://productstore.uz` boʻlishi shart (sitemap va ijtimoiy tarmoq havolalari uchun).

### Zaxira nusxa

Hamma maʼlumot `data/` papkasida (yoki `DATA_DIR` da). Uni muntazam nusxalang, masalan:

```bash
tar czf backup-$(date +%F).tar.gz data/
```

### Parolni unutsangiz

```bash
npm run reset-password
```

Shundan soʻng `.env.local` (yoki `.env.production`) dagi `ADMIN_PASSWORD` bilan kirasiz.

---

## Texnik maʼlumot

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- SQLite (`better-sqlite3`), rasmlar `sharp` orqali WebP formatga oʻtkaziladi (bir nechta oʻlchamda)
- Tuzilma: `src/app/(site)/[locale]` — sayt, `src/app/(admin)/admin` — admin panel, `src/lib` — maʼlumotlar qatlami, `src/components` — interfeys
- Tarjimalar: `src/lib/i18n/uz.ts`, `src/lib/i18n/ru.ts`
