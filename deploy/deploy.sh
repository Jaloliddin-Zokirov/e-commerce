#!/usr/bin/env bash
# Uploads the site from this computer to the server and starts it (for the first install and for updates).
#
#   ./deploy/deploy.sh ubuntu@SERVER_IP ~/Downloads/ssh-key.key [domain]
#
# The first upload copies the local catalog (products, banners, settings, photos) to the server;
# requests and the admin password are not copied. Later uploads only update the code and leave the
# server's data alone. data/backups is never sent.
set -euo pipefail

TARGET="${1:-}"
KEY="${2:-}"
DOMAIN="${3:-}"
if [ -z "$TARGET" ] || [ -z "$KEY" ]; then
  echo "Usage: ./deploy/deploy.sh ubuntu@SERVER_IP SSH_KEY_FILE [domain]"
  exit 1
fi
[ -f "$KEY" ] || { echo "SSH key file not found: $KEY"; exit 1; }
HOST="${TARGET#*@}"
APP_DIR=/opt/productstore
DATA_DIR=/var/lib/productstore

cd "$(dirname "$0")/.."
chmod 600 "$KEY"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30)
remote() { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }
push() { rsync -az -e "ssh ${SSH_OPTS[*]}" "$@"; }

echo "▶ Connecting to the server: $TARGET"
remote "sudo mkdir -p $APP_DIR $DATA_DIR && sudo chown \$(id -un):\$(id -un) $APP_DIR $DATA_DIR && \
  (command -v rsync >/dev/null || (sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq rsync))"

echo "▶ Uploading the code"
push --delete \
  --exclude '/node_modules/' --exclude '/data/' --exclude '/.env*' --exclude '/.*/' \
  --exclude '/*.md' --exclude '/*.tsbuildinfo' --exclude '.DS_Store' \
  ./ "$TARGET:$APP_DIR/"

if ! remote "test -f $DATA_DIR/store.db"; then
  echo "▶ First upload: copying the database and photos"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  # A consistent snapshot even while the local dev server has the database open. Orders and the local
  # admin password stay on this computer: the server starts with an empty inbox and its own password.
  node -e '
    const Database = require("better-sqlite3");
    Database("data/store.db", { readonly: true }).backup(process.argv[1]).then(() => {
      const copy = Database(process.argv[1]);
      copy.exec("DELETE FROM leads; DELETE FROM kv WHERE key IN (\x27auth.hash\x27, \x27auth.secret\x27); VACUUM;");
      copy.close();
    });
  ' "$TMP/store.db"
  push "$TMP/store.db" "$TARGET:$DATA_DIR/store.db"
  push data/uploads/ "$TARGET:$DATA_DIR/uploads/"
fi

echo "▶ Installing on the server"
ssh -t "${SSH_OPTS[@]}" "$TARGET" \
  "PUBLIC_IP='$HOST' DOMAIN='$DOMAIN' APP_DIR='$APP_DIR' DATA_DIR='$DATA_DIR' bash '$APP_DIR/deploy/setup-server.sh'"
