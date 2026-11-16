#!/usr/bin/env bash
# Installs or updates the online catalog on an Ubuntu 24.04 server (Oracle Cloud Always Free: ARM or AMD).
# deploy/deploy.sh normally runs it; running it again is safe, and that is also how updates work.
#
#   PUBLIC_IP  the server's public IP address (passed by deploy.sh)
#   DOMAIN     domain for HTTPS. Empty means <ip>.sslip.io, "none" means HTTP only
#   APP_DIR    code folder (default /opt/productstore)
#   DATA_DIR   database and photos (default /var/lib/productstore)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/productstore}"
DATA_DIR="${DATA_DIR:-/var/lib/productstore}"
PUBLIC_IP="${PUBLIC_IP:-}"
DOMAIN="${DOMAIN:-}"
APP_USER="$(id -un)"
ENV_FILE=/etc/productstore.env
PORT=3000
NODE_MAJOR=24

log() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m! %s\033[0m\n' "$*"; }

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this script as a regular user (for example ubuntu), not as root."
  exit 1
fi
[ -f "$APP_DIR/package.json" ] || { echo "No project found in $APP_DIR; upload the code with deploy/deploy.sh first."; exit 1; }
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org || true)"
fi
if [ -z "$DOMAIN" ] && [ -n "$PUBLIC_IP" ]; then
  # sslip.io maps 1-2-3-4.sslip.io to 1.2.3.4, so a free HTTPS certificate works without buying a domain.
  DOMAIN="${PUBLIC_IP//./-}.sslip.io"
fi

export DEBIAN_FRONTEND=noninteractive

log "System packages"
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg openssl build-essential python3 nginx rsync sqlite3 cron certbot python3-certbot-nginx

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$NODE_MAJOR" ]; then
  log "Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi
NODE_BIN="$(command -v node)"

# The 1 GB shapes run out of memory during `next build` without swap.
if [ "$(free -m | awk '/^Mem:/ {print $2}')" -lt 3000 ] && ! swapon --show | grep -q /swapfile; then
  log "Swap (2 GB)"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

log "Folders"
sudo mkdir -p "$APP_DIR" "$DATA_DIR/uploads" "$DATA_DIR/backups"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"

# Secrets live outside the code folder, so a new upload never overwrites them.
NEW_PASSWORD=""
if ! sudo test -f "$ENV_FILE"; then
  log "Secrets ($ENV_FILE)"
  NEW_PASSWORD="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | cut -c1-16)"
  sudo tee "$ENV_FILE" >/dev/null <<EOF
ADMIN_PASSWORD=$NEW_PASSWORD
SESSION_SECRET=$(openssl rand -hex 32)
SITE_URL=http://$PUBLIC_IP
DATA_DIR=$DATA_DIR
EOF
  sudo chown "root:$APP_USER" "$ENV_FILE"
  sudo chmod 640 "$ENV_FILE"
fi

log "Dependencies and build (a few minutes)"
cd "$APP_DIR"
# A running server would trip over node_modules and .next being replaced under it.
if systemctl list-unit-files productstore.service >/dev/null 2>&1; then sudo systemctl stop productstore || true; fi
npm ci --no-audit --no-fund
# Build with the server's data folder, so nothing creates a stray ./data next to the code.
set -a
# shellcheck disable=SC1090
. <(sudo cat "$ENV_FILE")
set +a
NODE_ENV=production npm run build

log "Service (systemd)"
sudo tee /etc/systemd/system/productstore.service >/dev/null <<EOF
[Unit]
Description=Online catalog
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
Environment=NODE_ENV=production
ExecStart=$NODE_BIN $APP_DIR/node_modules/next/dist/bin/next start -p $PORT -H 127.0.0.1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable productstore >/dev/null
sudo systemctl restart productstore

log "Nginx"
SITE_CONF=/etc/nginx/sites-available/productstore
# Written once: certbot adds its HTTPS lines to this file and a later run must not wipe them.
if [ ! -f "$SITE_CONF" ]; then
  sudo tee "$SITE_CONF" >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name __DOMAIN__ _;
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:__PORT__;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
EOF
  sudo sed -i "s/__DOMAIN__/${DOMAIN:-_}/; s/__PORT__/$PORT/" "$SITE_CONF"
  sudo ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/productstore
  sudo rm -f /etc/nginx/sites-enabled/default
elif [ -n "$DOMAIN" ] && [ "$DOMAIN" != "none" ] && ! grep -q "server_name.* $DOMAIN[ ;]" "$SITE_CONF"; then
  # A new domain on a later run: let nginx (and certbot) recognise it too.
  sudo sed -i "s/server_name \(.*\);/server_name \1 $DOMAIN;/" "$SITE_CONF"
fi
sudo nginx -t
sudo systemctl enable nginx >/dev/null
sudo systemctl reload nginx || sudo systemctl restart nginx

log "Firewall: ports 80 and 443"
# Oracle's Ubuntu images reject everything except SSH in iptables, on top of the cloud Security List.
if command -v iptables >/dev/null; then
  for p in 80 443; do
    sudo iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null ||
      sudo iptables -I INPUT 1 -p tcp --dport "$p" -m state --state NEW -j ACCEPT
  done
  if command -v netfilter-persistent >/dev/null; then sudo netfilter-persistent save >/dev/null 2>&1 || true; fi
fi
if command -v ufw >/dev/null && sudo ufw status | grep -q "Status: active"; then sudo ufw allow "Nginx Full" >/dev/null; fi

SITE_URL="http://${PUBLIC_IP:-localhost}"
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "none" ]; then
  if sudo test -d "/etc/letsencrypt/live/$DOMAIN"; then
    SITE_URL="https://$DOMAIN"
  else
    log "HTTPS certificate: $DOMAIN (Let's Encrypt)"
    if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
      SITE_URL="https://$DOMAIN"
    else
      warn "Could not get HTTPS. Are ports 80 and 443 open in the Oracle Security List? The site runs on HTTP for now."
    fi
  fi
fi
if [ "${SITE_URL#https://}" != "$SITE_URL" ]; then
  # Certbot answers plain-HTTP requests for other names (the bare IP) with 404; send them to the site instead.
  sudo sed -i "s|return 404; # managed by Certbot|return 301 $SITE_URL\$request_uri; # managed by Certbot|" "$SITE_CONF"
  sudo nginx -t && sudo systemctl reload nginx
fi
sudo sed -i "s#^SITE_URL=.*#SITE_URL=$SITE_URL#" "$ENV_FILE"
sudo systemctl restart productstore

log "Daily backup"
sudo tee /etc/cron.daily/productstore-backup >/dev/null <<'EOF'
#!/bin/sh
# Daily copy of the store database and photos; the last 7 days are kept.
# sqlite3 runs as the app user: files it creates next to the database must stay writable by the site.
set -e
. /etc/productstore.env
DIR="$DATA_DIR/backups"
STAMP=$(date +%F)
runuser -u __USER__ -- sqlite3 "$DATA_DIR/store.db" ".backup '$DIR/store-$STAMP.db'"
tar czf "$DIR/uploads-$STAMP.tar.gz" -C "$DATA_DIR" uploads
find "$DIR" -name 'store-*.db' -mtime +7 -delete
find "$DIR" -name 'uploads-*.tar.gz' -mtime +7 -delete
EOF
sudo sed -i "s/__USER__/$APP_USER/" /etc/cron.daily/productstore-backup
sudo chmod 755 /etc/cron.daily/productstore-backup

log "Health check"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/uz"; then break; fi
  sleep 2
done
if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/uz"; then
  printf '\n\033[1;32m✔ The site is up\033[0m\n'
else
  warn "The site did not respond. Logs: sudo journalctl -u productstore -n 80"
fi

echo
echo "  Site:   $SITE_URL/uz"
echo "  Admin:  $SITE_URL/admin"
if [ -n "$NEW_PASSWORD" ]; then
  echo "  Admin password: $NEW_PASSWORD"
  echo "  (Shown only now. It is stored on the server in $ENV_FILE.)"
else
  echo "  Admin password: unchanged (in $ENV_FILE on the server)."
fi
echo
