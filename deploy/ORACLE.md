# Oracle Cloud (tekin) serverga joylash

Sayt Oracle Cloud'ning **Always Free** (muddatsiz tekin) serverida ishlaydi. 1–3-qadamlarni Oracle saytida
bajarasiz (taxminan 20 daqiqa). 4-qadamda esa bitta buyruq qolgan hammasini oʻzi bajaradi: serverni sozlaydi,
saytni yuklaydi, HTTPS oladi va har kuni zaxira nusxa olib turadi.

## 1. Roʻyxatdan oʻtish

1. <https://signup.cloud.oracle.com> ga kiring va **Free Tier** hisobini oching.
2. **Home Region** ni oʻylab tanlang — keyin oʻzgartirib boʻlmaydi. Oʻzbekistonga yaqinlari: *Germany Central
   (Frankfurt)* yoki *UAE East (Dubai)*.
3. Bank kartasi soʻraladi. Bu faqat shaxsingizni tasdiqlash uchun: tekin (Always Free) resurslar uchun pul yechilmaydi.
   Hisobni **«Upgrade to Pay As You Go»** ga oʻtkazmang — shunda tasodifan ham toʻlov chiqmaydi.

## 2. Tarmoq yaratish (bir marta)

**☰ Menu → Networking → Virtual cloud networks → Actions → Start VCN Wizard → «Create VCN with Internet Connectivity»**,
nomi `productstore-vcn` → **Create**. Keyin shu VCN → **Security → Default Security List → Security rules → Add Ingress Rules**:

| Source CIDR | IP Protocol | Destination Port Range |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

> Tarmoqni server bilan birga yaratsangiz, yangi interfeysda «public IPv4» tugmasi ishlamaydi — shuning uchun avval tarmoq.

## 3. Server yaratish

SSH kalitni kompyuterda yarating (bir marta): `ssh-keygen -t ed25519 -N "" -f ~/.ssh/productstore_oracle`.

**☰ Menu → Compute → Instances → Create instance**

| Maydon | Nima tanlanadi |
|---|---|
| Name | `productstore` |
| Image | **Change image → Ubuntu → Canonical Ubuntu 24.04** |
| Shape | **Change shape → Ampere → VM.Standard.A1.Flex** («Always Free-eligible»), 1 OCPU / 6 GB yetadi |
| Networking | «Select existing virtual cloud network» → `productstore-vcn`, subnet — *public subnet*, **Automatically assign public IPv4 address** yoqilgan |
| Add SSH keys | **Paste public key** → `~/.ssh/productstore_oracle.pub` ichidagi qator |
| Boot volume | oʻzgartirmang (46.6 GB, tekin 200 GB ichida) |

**Create** ni bosing. Holati **RUNNING** boʻlgach, **Public IP address** ni koʻchirib oling.

> **«Out of capacity»** chiqsa — boshqa *Availability domain* (AD-1, AD-2, AD-3) ni tanlab qayta bosing yoki keyinroq urining.

## 4. Saytni yuklash — bitta buyruq

Mac'da Terminal'ni oching va (IP va kalit faylini oʻzingiznikiga almashtirib) ishga tushiring:

```bash
cd ~/Desktop/Product
./deploy/deploy.sh ubuntu@SERVER_IP ~/.ssh/productstore_oracle
```

Birinchi marta 5–10 daqiqa ketadi. Oxirida shunday yozuv chiqadi:

```
  Sayt:   https://1-2-3-4.sslip.io/uz
  Admin:  https://1-2-3-4.sslip.io/admin
  Admin paroli: ••••••••••••••••
```

- **Admin parolini yozib oling** — u faqat birinchi oʻrnatishda koʻrsatiladi (serverda `/etc/productstore.env` faylida
  saqlanadi). Kirgach, Admin → Sozlamalar'da oʻzingizning parolingizga almashtirishingiz mumkin.
- Domen sotib olmasdan HTTPS boʻlishi uchun `IP.sslip.io` manzili ishlatiladi (bepul xizmat). Sertifikat olishda skript
  Let's Encrypt shartlariga rozilik bildiradi.
- Birinchi yuklashda shu kompyuterdagi mahsulotlar, bannerlar, rasmlar va soxta aloqa maʼlumotlari serverga
  koʻchadi. `data/backups` papkasi (unda eski haqiqiy maʼlumotlar bor) **yuborilmaydi**.

## Keyin

**Saytni yangilash** (kodni oʻzgartirgandan keyin) — xuddi shu buyruq. Serverdagi mahsulotlar va buyurtmalarga tegilmaydi:

```bash
./deploy/deploy.sh ubuntu@SERVER_IP ~/.ssh/productstore_oracle
```

**Oʻz domeningiz boʻlsa** (masalan `example.uz`): domen DNS'ida `A` yozuvini server IP'siga qarating, keyin:

```bash
./deploy/deploy.sh ubuntu@SERVER_IP ~/.ssh/productstore_oracle example.uz
```

**Jurnal (xatolarni koʻrish):**

```bash
ssh -i ~/.ssh/productstore_oracle ubuntu@SERVER_IP 'sudo journalctl -u productstore -n 100'
```

**Zaxira nusxalar** — har kuni serverdagi `/var/lib/productstore/backups` papkasiga yoziladi (oxirgi 7 kun). Kompyuterga
yuklab olish:

```bash
scp -i ~/.ssh/productstore_oracle -r ubuntu@SERVER_IP:/var/lib/productstore/backups ./server-backups
```

**Admin parolini unutsangiz** (parol `/etc/productstore.env` dagi qiymatga qaytadi):

```bash
ssh -i ~/.ssh/productstore_oracle ubuntu@SERVER_IP 'cd /opt/productstore && set -a && . <(sudo cat /etc/productstore.env) && set +a && npm run reset-password && sudo cat /etc/productstore.env | grep ADMIN_PASSWORD'
```

## Bilish kerak boʻlgan cheklovlar

- Oracle tekin serverni uzoq vaqt deyarli ishlatilmasa «boʻsh turibdi» deb **toʻxtatib qoʻyishi** mumkin. Unda Oracle
  konsolida serverni qayta **Start** qiling — maʼlumotlar diskda qoladi.
- Server toʻxtasa ham, buzilsa ham maʼlumot yoʻqolmasligi uchun vaqti-vaqti bilan zaxira nusxalarni kompyuterga
  yuklab oling (yuqoridagi `scp` buyrugʻi).
