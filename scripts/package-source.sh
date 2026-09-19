#!/usr/bin/env bash
# Empacota o código-fonte do projeto em public/eu-cardapio-financeiro.zip
# Uso: bash scripts/package-source.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="$(mktemp -d)/eu-cardapio"
OUT="$ROOT/public/eu-cardapio-financeiro.zip"

mkdir -p "$STAGE"
rsync -a \
  --exclude node_modules \
  --exclude .git \
  --exclude dist \
  --exclude .output \
  --exclude .nitro \
  --exclude .tanstack \
  --exclude .lovable \
  --exclude 'bun.lock*' \
  --exclude package-lock.json \
  --exclude pnpm-lock.yaml \
  --exclude yarn.lock \
  --exclude '*.tsbuildinfo' \
  --exclude 'public/eu-cardapio-financeiro.zip' \
  "$ROOT/" "$STAGE/"

rm -f "$OUT"
mkdir -p "$ROOT/public"
(cd "$(dirname "$STAGE")" && zip -qr "$OUT" "$(basename "$STAGE")")
echo "Gerado: $OUT"
