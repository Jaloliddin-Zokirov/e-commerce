# Deploying to a free Oracle Cloud server

The site runs on an Oracle Cloud **Always Free** server (free with no time limit). Steps 1–3 are done on the Oracle
website (about 20 minutes). In step 4 a single command does everything else: it sets up the server,
uploads the site, gets HTTPS and takes a backup every day.

## 1. Sign up

1. Go to <https://signup.cloud.oracle.com> and open a **Free Tier** account.
2. Choose the **Home Region** carefully — it cannot be changed later. The closest ones to Uzbekistan: *Germany Central
   (Frankfurt)* or *UAE East (Dubai)*.
3. A bank card is required. It is only used to verify your identity: nothing is charged for Always Free resources.
   Do not switch the account to **"Upgrade to Pay As You Go"**, so that no charge can happen even by accident.

## 2. Create the network (once)

**☰ Menu → Networking → Virtual cloud networks → Actions → Start VCN Wizard → "Create VCN with Internet Connectivity"**,
name `productstore-vcn` → **Create**. Then open that VCN → **Security → Default Security List → Security rules → Add Ingress Rules**:

| Source CIDR | IP Protocol | Destination Port Range |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

> If the network is created together with the server, the "public IPv4" toggle does not work in the new console; that is why the network comes first.

## 3. Create the server

Create an SSH key on your computer (once): `ssh-keygen -t ed25519 -N "" -f ~/.ssh/productstore_oracle`.

**☰ Menu → Compute → Instances → Create instance**

| Field | What to choose |
|---|---|
| Name | `productstore` |
| Image | **Change image → Ubuntu → Canonical Ubuntu 24.04** |
| Shape | **Change shape → Ampere → VM.Standard.A1.Flex** ("Always Free-eligible"), 1 OCPU / 6 GB is enough |
| Networking | "Select existing virtual cloud network" → `productstore-vcn`, subnet — *public subnet*, **Automatically assign public IPv4 address** turned on |
| Add SSH keys | **Paste public key** → the line from `~/.ssh/productstore_oracle.pub` |
| Boot volume | leave as is (46.6 GB, within the free 200 GB) |

Press **Create**. When the state is **RUNNING**, copy the **Public IP address**.

> If **"Out of capacity"** appears, pick another *Availability domain* (AD-1, AD-2, AD-3) and try again, or try later.

## 4. Upload the site — one command

Open Terminal on the Mac and run (with your own IP and key file):

```bash
cd ~/Desktop/Product
./deploy/deploy.sh ubuntu@SERVER_IP ~/.ssh/productstore_oracle
```

The first run takes 5–10 minutes. At the end it prints:

```
  Site:   https://1-2-3-4.sslip.io/uz
  Admin:  https://1-2-3-4.sslip.io/admin
  Admin password: ••••••••••••••••
```

- **Write the admin password down** — it is shown only on the first install (on the server it is stored in
  `/etc/productstore.env`). After signing in you can change it in Admin → Settings.
- To get HTTPS without buying a domain, the `IP.sslip.io` address is used (a free service). When requesting the
  certificate, the script accepts the Let's Encrypt terms.
- On the first upload, the products, banners, photos and fake contact details from this computer are copied to the
  server. The `data/backups` folder (it holds old real data) is **not sent**.

## Later

**Updating the site** (after changing the code) — the same command. Products and orders on the server are left untouched:

```bash
./deploy/deploy.sh ubuntu@SERVER_IP ~/.ssh/productstore_oracle
```

**With your own domain** (for example `example.uz`): point the domain's DNS `A` record to the server IP, then run:

```bash
./deploy/deploy.sh ubuntu@SERVER_IP ~/.ssh/productstore_oracle example.uz
```

**Logs (to see errors):**

```bash
ssh -i ~/.ssh/productstore_oracle ubuntu@SERVER_IP 'sudo journalctl -u productstore -n 100'
```

**Backups** are written every day to `/var/lib/productstore/backups` on the server (the last 7 days are kept). To download
them to your computer:

```bash
scp -i ~/.ssh/productstore_oracle -r ubuntu@SERVER_IP:/var/lib/productstore/backups ./server-backups
```

**If you forget the admin password** (it is reset to the value in `/etc/productstore.env`):

```bash
ssh -i ~/.ssh/productstore_oracle ubuntu@SERVER_IP 'cd /opt/productstore && set -a && . <(sudo cat /etc/productstore.env) && set +a && npm run reset-password && sudo cat /etc/productstore.env | grep ADMIN_PASSWORD'
```

## Limits to know about

- Oracle may **stop** a free server that stays almost idle for a long time. If that happens, **Start** it again in the
  Oracle console; the data stays on the disk.
- So that nothing is lost if the server stops or breaks, download the backups to your computer from time to time
  (the `scp` command above).
