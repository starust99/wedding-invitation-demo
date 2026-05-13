#!/usr/bin/env bash
set -euo pipefail

CHROME_BIN="${CHROME_BIN:-}"

if [[ -z "$CHROME_BIN" ]]; then
  CHROME_BIN="$(find "$HOME/Library/Caches/ms-playwright" -path "*Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" -type f | head -n 1)"
fi

if [[ -z "$CHROME_BIN" || ! -x "$CHROME_BIN" ]]; then
  echo "Cannot find Playwright Chrome for Testing."
  echo "Run: npx playwright install chromium"
  exit 1
fi

exec "$CHROME_BIN" \
  --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir=/tmp/np-chrome-cdp \
  --window-size=1440,900 \
  --no-first-run \
  --disable-extensions \
  http://localhost:3000/
