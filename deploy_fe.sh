#!/usr/bin/env bash
#
# deploy_frontend.sh — build the React app into frontend/dist/.
# Safe & idempotent. nginx serves dist/ under /app (see DEPLOY.md).
#
# Usage:
#   bash deploy_frontend.sh           # install deps + build
#   bash deploy_frontend.sh --clean   # wipe node_modules first (fixes weird build issues)
#
# Tweak if needed:
FRONTEND_DIR="${FRONTEND_DIR:-/var/www/sudosudev/frontend}"

set -euo pipefail
g="\033[0;32m"; y="\033[0;33m"; r="\033[0;31m"; n="\033[0m"
info(){ echo -e "${y}▸ $1${n}"; }
ok(){   echo -e "${g}✓ $1${n}"; }
err(){  echo -e "${r}✗ $1${n}" >&2; }

[ -d "$FRONTEND_DIR" ] || { err "FRONTEND_DIR not found: $FRONTEND_DIR"; exit 1; }
cd "$FRONTEND_DIR"
[ -f package.json ] || { err "package.json not found — is this the frontend folder?"; exit 1; }

command -v npm >/dev/null 2>&1 || { err "npm not installed on this server. Install Node.js first."; exit 1; }
info "Node $(node -v) · npm $(npm -v)"

if [ "${1:-}" = "--clean" ]; then
  info "Removing node_modules…"
  rm -rf node_modules
fi

# npm ci is faster & reproducible when a lockfile exists; fall back to install
if [ -f package-lock.json ]; then
  info "Installing dependencies (npm ci)…"
  npm ci --silent || npm install --silent
else
  info "Installing dependencies (npm install)…"
  npm install --silent
fi
ok "Dependencies installed."

info "Building (vite build, base=/app/)…"
npm run build
ok "Build complete → ${FRONTEND_DIR}/dist/"

# quick sanity checks
[ -f dist/index.html ] && ok "dist/index.html present"
[ -f dist/favicon.svg ] && ok "dist/favicon.svg present" || echo -e "${y}  (favicon.svg not in dist — check frontend/public/favicon.svg)${n}"
echo "  nginx should serve this via:  location /app/ { alias ${FRONTEND_DIR}/dist/; try_files \$uri \$uri/ /app/index.html; }"