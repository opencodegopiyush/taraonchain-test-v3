#!/usr/bin/env bash
# taraonchain TEST BUILD (v3) — run locally on Fedora
# usage:  bash run-local.sh
# opens on http://localhost:3000
set -euo pipefail

cd "$(dirname "$0")"

echo "── taraonchain TEST BUILD V3 · local run ─────────────────────"

# 1 · node.js present?
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is missing. Install it first:"
  echo "  sudo dnf install nodejs npm"
  echo "(needs Node 20.9+ — 'node -v' to check; if older, use nvm:"
  echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  echo "  source ~/.bashrc && nvm install 20 )"
  exit 1
fi
echo "node $(node -v) · npm $(npm -v)"

# 2 · dependencies
if [ ! -d node_modules ]; then
  echo "installing dependencies (one-time, a few minutes)…"
  # retry-hardened flags: survives flaky networks / ECONNRESET
  if ! npm install --no-audit --no-fund --fetch-retries=6 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000; then
    echo "npm registry failed — retrying via npmmirror…"
    npm install --no-audit --no-fund --registry=https://registry.npmmirror.com --fetch-retries=6 --fetch-timeout=600000
  fi
else
  echo "dependencies already installed — skipping"
fi

# 3 · prisma client (no database needed — the SHARAV case ships bundled)
echo "generating prisma client…"
npx prisma generate

# 4 · dev server
echo ""
echo "starting → http://localhost:3000  (Ctrl+C to stop)"
echo "no database required: the S-0830 SHARAV investigation is bundled · v3 — the case desk."
echo ""
npm run dev
