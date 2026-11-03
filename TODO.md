# TODO — keyinroq ulanadigan va tekshiriladigan ishlar

UI toʻliq tugagach shu roʻyxat boʻyicha bir chetdan oʻtamiz. Koddagi joylar `TODO(...)` izohi bilan belgilangan
(`grep -rn "TODO(" src` bilan topiladi).

## Ulanmagan qismlar

- [ ] **Buyurtmalar qayerga borishi** — `TODO(order-delivery)`
      «Buyurtma berish» oynasi (`src/components/site/order-dialog.tsx`) va server amali (`src/app/actions/lead.ts`).
      Hozir: buyurtma admin paneldagi **Soʻrovlar** boʻlimiga darhol, sahifani yangilamasdan tushadi (🛒 Buyurtma belgisi,
      bildirishnoma va son bilan); Sozlamalarda bot ulansa, Telegram-botga ham ketadi. Hal qilish kerak: bot shaxsiy chatga, kanalga yoki guruhga yozsinmi,
      bir nechta menejerga taqsimlansinmi.
- [ ] **Bosh sahifa statistikasi** — `TODO(stats)` (`src/lib/i18n/uz.ts`, `ru.ts`)
      «25 yil», «21K+ Instagram», «4K+ Telegram», «100%» qoʻlda yozilgan. Admin panel → Sozlamalarga koʻchirish.
- [ ] **Ish vaqti kunlari** — `TODO(work-hours)` (`src/components/site/open-status.tsx`)
      «Hozir ochiq / yopiq» belgisi faqat «10:00 – 21:00» kabi soatni oʻqiydi, hafta kunlarini hisobga olmaydi.
- [ ] **Yetkazib berish** — `TODO(delivery)`
      «Qanday buyurtma beriladi» 3-qadami doʻkondan olib ketishni nazarda tutadi. Yetkazib berish boʻlsa, matnni oʻzgartirish.

## Doʻkon egasi bilan aniqlashtirish

- [ ] **Haqiqiy aloqa maʼlumotlari** — hozir saytda ataylab *soxta* maʼlumotlar turibdi (telefon `+998 00 000 00 00`,
      Telegram `demo_manager_`, Instagram → example.com, demo manzil, xarita — shahar markazi). Ishga tushirishdan oldin
      Admin → Sozlamalar → Aloqa / Manzil boʻlimida haqiqiylarini kiritish. Oldingi qiymatlar zaxirada:
      `data/backups/store-before-demo-contacts.db`.
- [ ] Ish vaqti (hozir: «Har kuni 10:00 – 21:00» — taxminiy).
- [ ] Dollar kursi (Sozlamalar → «MB kursini olish»).
- [ ] Demo mahsulotlar oʻrniga haqiqiy mahsulot va fotosuratlar (Sozlamalar → Maʼlumotlar → «Demolarni oʻchirish»).
- [ ] **Rasmlar** — hozir demo mahsulotlarda ishlab chiqaruvchilarning rasmiy fotosuratlari turibdi (Apple, DJI, Dell, Shure,
      SanDisk, Fractal, NZXT) — test uchun. Ochiq savdodan oldin oʻz rasmlaringizga almashtiring yoki brendlarning
      diler shartlarini tekshiring. Chizilgan rasmli eski holat zaxirasi: `data/backups/store-before-photos.db`.
- [ ] YouTube kanal havolasi (Sozlamalar → Aloqa).

## Joylash

- [x] Test server: Oracle Cloud Always Free (Frankfurt, Ampere A1, 1 OCPU / 6 GB) — <https://92-5-89-180.sslip.io>.
      Yangilash: `./deploy/deploy.sh ubuntu@92.5.89.180 ~/.ssh/productstore_oracle`. Admin paroli: `.env.server` (faqat shu kompyuterda).
- [ ] `productstore.uz` domenini serverga ulash (DNS `A` → 92.5.89.180, keyin deploy.sh ga domen bilan).
- [ ] Docker image hali real konteynerda sinalmagan.
