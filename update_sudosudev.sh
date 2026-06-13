#!/usr/bin/env bash
#
# update_sudosudev.sh — deploy the latest build (landing + react app + flask api).
#
# Layout on the server:
#   /var/www/sudosu/          (git repo: landing/ + frontend/ + backend/)
#   /var/www/sudosudev-api/   (optional separate copy of backend/, if you keep it apart)
#
# Usage:
#   sudo bash update_sudosudev.sh            # pull + build front + restart api
#   sudo bash update_sudosudev.sh --no-build # pull only (e.g. backend-only change)

set -euo pipefail

REPO_DIR="/var/www/sudosu"
BRANCH="main"
API_SERVICE="sudosudev-api"
BUILD=true
[ "${1:-}" = "--no-build" ] && BUILD=false

g="\033[0;32m"; y="\033[0;33m"; r="\033[0;31m"; b="\033[0;36m"; n="\033[0m"
info(){ echo -e "${y}▸ $1${n}"; }
ok(){   echo -e "${g}✓ $1${n}"; }
err(){  echo -e "${r}✗ $1${n}" >&2; }

[ -d "$REPO_DIR/.git" ] || { err "$REPO_DIR is not a git repo."; exit 1; }
cd "$REPO_DIR"

info "Fetching origin/${BRANCH}…"
git fetch --quiet origin "$BRANCH"
LOCAL=$(git rev-parse @); REMOTE=$(git rev-parse "origin/${BRANCH}")

if [ "$LOCAL" = "$REMOTE" ]; then
  ok "Already up to date ($(git rev-parse --short @))."
else
  info "Updating $(git rev-parse --short @) → $(git rev-parse --short "$REMOTE")…"
  git pull --ff-only origin "$BRANCH"
  echo -e "${b}── changelog ──${n}"
  git log --oneline --no-decorate "${LOCAL}..${REMOTE}" | sed 's/^/  /'
fi

# ── build the React app ──
if [ "$BUILD" = true ] && [ -d "$REPO_DIR/frontend" ]; then
  info "Building React app (frontend/)…"
  cd "$REPO_DIR/frontend"
  npm ci --silent || npm install --silent
  npm run build --silent
  ok "Front built → frontend/dist/"
  cd "$REPO_DIR"
fi

# ── restart the Flask API ──
if systemctl list-unit-files | grep -q "^${API_SERVICE}.service"; then
  info "Restarting ${API_SERVICE}…"
  # reinstall backend deps in case requirements changed
  if [ -x "/var/www/sudosudev-api/venv/bin/pip" ]; then
    /var/www/sudosudev-api/venv/bin/pip install -q -r "$REPO_DIR/backend/requirements.txt" || true
  fi
  systemctl restart "$API_SERVICE"
  ok "${API_SERVICE} restarted."
fi

# ── reload nginx (static) ──
if nginx -t >/dev/null 2>&1; then
  systemctl reload nginx
  ok "nginx reloaded."
else
  err "nginx config test failed — not reloaded."
fi

ok "Deploy complete → $(git rev-parse --short HEAD)"
echo "  Tip: hard-refresh (Ctrl/Cmd+Shift+R) and purge Cloudflare cache if you use it."
