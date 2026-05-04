#!/usr/bin/env bash
# Smoke-test Imagen 4 (Generate + Ultra) on Gemini Developer API.
# Same API key style as AI Studio (AIza...).
#
# Usage:
#   export GEMINI_API_KEY="AIza..."
#   ./scripts/test-imagen-curl.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEY="${GEMINI_API_KEY:-${GOOGLE_API_KEY:-}}"
if [[ -z "${KEY}" ]]; then
  echo "Missing GEMINI_API_KEY (or GOOGLE_API_KEY)."
  exit 1
fi

BODY='{"instances":[{"prompt":"Simple flat vector icon of a standing person, black silhouette on white background"}],"parameters":{"sampleCount":1,"aspectRatio":"1:1","personGeneration":"allow_adult"}}'

run_one() {
  local model="$1"
  local label="$2"
  echo ""
  echo "======== ${label} (${model}) ========"
  local tmp
  tmp="$(mktemp)"
  local http
  http="$(curl -sS -o "$tmp" -w '%{http_code}' \
    "https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${KEY}" \
    -H "Content-Type: application/json" \
    -d "${BODY}")"
  echo "HTTP ${http}"
  head -c 1200 "$tmp"
  echo ""
  rm -f "$tmp"
}

run_one "imagen-4.0-generate-001" "Imagen 4 Generate"
run_one "imagen-4.0-ultra-generate-001" "Imagen 4 Ultra Generate"

echo ""
echo "Model IDs:"
echo "  imagen-4.0-generate-001       (Imagen 4 Generate)"
echo "  imagen-4.0-ultra-generate-001 (Imagen 4 Ultra Generate)"
echo "Also available: imagen-4.0-fast-generate-001 (faster / cheaper)"
echo "Endpoint: POST .../v1beta/models/{MODEL}:predict?key=API_KEY"
