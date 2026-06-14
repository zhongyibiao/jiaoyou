#!/bin/bash
# 一键部署脚本（API + Web）
set -euo pipefail

REPO_DIR="/opt/jiaoyou"
APP_DIR="$REPO_DIR/server"
WEB_DIR="$REPO_DIR/client"
WEB_DIST="/var/www/jiaoyou"

cd "$REPO_DIR"
echo "==> [1/6] git pull"
git pull

echo "==> [2/6] API deps"
cd "$APP_DIR"
npm ci --production

echo "==> [3/6] DB migrate (idempotent)"
if [ -f .env ]; then
    set -a; . ./.env; set +a
fi
mysql -h"${DB_HOST:-127.0.0.1}" -P"${DB_PORT:-3306}" \
      -u"${DB_USER:-root}" -p"${DB_PASSWORD:-}" \
      "${DB_NAME:-jiaoyou}" < db/init.sql
mysql -h"${DB_HOST:-127.0.0.1}" -P"${DB_PORT:-3306}" \
      -u"${DB_USER:-root}" -p"${DB_PASSWORD:-}" \
      "${DB_NAME:-jiaoyou}" < db/indexes.sql

echo "==> [4/6] reload API"
pm2 reload jiaoyou-api || pm2 start src/app.js --name jiaoyou-api
pm2 save

echo "==> [5/6] build web"
cd "$WEB_DIR"
npm ci
npm run build

echo "==> [6/6] deploy web assets + reload nginx"
sudo mkdir -p "$WEB_DIST"
sudo rsync -a --delete dist/ "$WEB_DIST/"
sudo nginx -t && sudo systemctl reload nginx

echo "==> done"
