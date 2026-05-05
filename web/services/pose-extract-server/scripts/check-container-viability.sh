#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="pose-extract-server:local"
CONTAINER_NAME="pose-extract-server-viability"
HOST_PORT="38080"
DB_DIR=".docker-data"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[1/4] Building Docker image with better-sqlite3"
docker build -t "$IMAGE_TAG" .

echo "[2/4] Preparing mounted database directory"
mkdir -p "$DB_DIR"
chmod 0777 "$DB_DIR"
rm -f "$DB_DIR/keys.db"
cleanup

echo "[3/4] Starting container"
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$HOST_PORT:3000" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_PATH=/app/data/keys.db \
  -e ADMIN_SECRET=spike-admin-secret \
  -e APP_VERSION=docker-spike \
  -v "$(pwd)/$DB_DIR:/app/data" \
  "$IMAGE_TAG" >/dev/null

echo "[4/4] Waiting for /api/health and validating DB mount"
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${HOST_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -fsS "http://127.0.0.1:${HOST_PORT}/api/health"
if [[ ! -f "$DB_DIR/keys.db" ]]; then
  echo "ERROR: expected mounted database at $DB_DIR/keys.db"
  exit 1
fi

echo
echo "Container viability check passed."
