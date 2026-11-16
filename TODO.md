# TODO — things to connect and check later

When the UI is finished, we go through this list one item at a time. The places in the code are marked with `TODO(...)` comments
(find them with `grep -rn "TODO(" src`).

## Not connected yet

- [ ] **Where orders go** — `TODO(order-delivery)`
      The order dialog (`src/components/site/order-dialog.tsx`) and its server action (`src/app/actions/lead.ts`).
      Now: an order appears in the admin **Soʻrovlar** (Requests) section right away, without reloading the page (with the 🛒 order badge,
      a notification and a counter); if a bot is connected in Settings, it is also sent to the Telegram bot. To decide: should the bot post to a private chat, a channel or a group,
      and should orders be split between several managers?
- [ ] **Home page stats** — `TODO(stats)` (`src/lib/i18n/uz.ts`, `ru.ts`)
      "24/7", "15 min", "1 yil+", "100%" are sample figures written in the code. Move them to Admin → Settings.
- [ ] **Working days** — `TODO(work-hours)` (`src/components/site/open-status.tsx`)
      The "open now / closed" badge only reads hours such as "10:00 – 21:00" and ignores the days of the week.
- [ ] **Delivery** — `TODO(delivery)`
      Step 3 of the "How to order" block assumes pickup from the store. If the store delivers, change the text.

## To clarify with the store owner

- [ ] **Real contact details** — the site deliberately shows *fake* data for now (phone `+998 00 000 00 00`,
      Telegram `demo_manager_`, Instagram → example.com, a demo address, the map at the city centre). Before launch, enter
      the real ones in Admin → Settings → Contacts / Address. The previous values are backed up in
      `data/backups/store-before-demo-contacts.db`.
- [ ] Working hours (now "Har kuni 10:00 – 21:00", an estimate).
- [ ] Dollar rate (Settings → "MB kursini olish").
- [ ] Real products and photos instead of the demo ones (Settings → Data → "Demolarni oʻchirish").
- [ ] **Photos** — the demo products use the manufacturers' official photos (Apple, DJI, Dell, Shure,
      SanDisk, Fractal, NZXT) for testing. Before opening to the public, replace them with your own photos or check the brands'
      reseller terms. Backup of the earlier state with drawn images: `data/backups/store-before-photos.db`.
- [ ] YouTube channel link (Settings → Contacts).

## Hosting

- [x] Test server: Oracle Cloud Always Free (Frankfurt, Ampere A1, 1 OCPU / 6 GB) — <https://92-5-89-180.sslip.io>.
      Update: `./deploy/deploy.sh ubuntu@92.5.89.180 ~/.ssh/productstore_oracle`. The admin password is in `/etc/productstore.env` on the server.
- [ ] Once a domain is chosen, connect it to the server (DNS `A` → 92.5.89.180, then run deploy.sh with the domain).
- [ ] The Docker image has not been tested in a real container yet.
