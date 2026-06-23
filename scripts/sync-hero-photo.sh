#!/usr/bin/env bash
set -euo pipefail
SRC="${1:-/Users/augustinathan/Documents/TerraCotta/FILE HOAN THIEN/N&P 1_183a.jpg}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/assets/wedding/hero/np-1-183a.jpg"
if [[ ! -f "$SRC" ]]; then
  echo "Không thấy: $SRC"
  echo "Chạy: ./scripts/sync-hero-photo.sh '/đường/dẫn/N&P 1_183a.jpg'"
  exit 1
fi
cp "$SRC" "$DEST"
echo "OK → $DEST"
ls -la "$DEST"
