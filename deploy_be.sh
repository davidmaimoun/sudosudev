#!/usr/bin/env bash
#
# deploy_backend.sh — set up / update the Flask API (venv, deps, .env scaffold).
# Safe & idempotent. Does NOT touch nginx, Krokee, or your secrets.
#
# Usage:
#   bash deploy_backend.sh                 # venv + deps (+ .env scaffold on first run)
#   bash deploy_backend.sh --restart       # also restart the systemd service
#   sudo bash deploy_backend.sh --install-service   # write the systemd unit (first time)
#
# Tweak these if your paths/port differ:
API_DIR="${API_DIR:-/var/www/sudosudev-api}"      # where the backend lives on the server
SERVICE="${SERVICE:-sudosudev-api}"
PORT="${PORT:-8001}"                               # 8001 to avoid clashing with Krokee (8000)
RUN_USER="${RUN_USER:-www-data}"

set -euo pipefail
g="\033[0;32m"; y="\033[0;33m"; r="\033[0;31m"; n="\033[0m"
info(){ echo -e "${y}▸ $1${n}"; }
ok(){   echo -e "${g}✓ $1${n}"; }
err(){  echo -e "${r}✗ $1${n}" >&2; }

[ -d "$API_DIR" ] || { err "API_DIR not found: $API_DIR  (copy backend/ there first)"; exit 1; }
cd "$API_DIR"
[ -f run.py ] || { err "run.py not found in $API_DIR — is this the backend folder?"; exit 1; }

# ── venv ──
if [ ! -d venv ]; then
  info "Creating virtualenv…"
  python3 -m venv venv
fi
info "Installing dependencies…"
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements.txt
ok "Dependencies installed."

# ── .env scaffold (only if missing — never overwrites your secrets) ──
if [ ! -f .env ]; then
  info "No .env found — creating one from .env.example…"
  cp .env.example .env
  SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  # set SECRET_KEY and COOKIE_SECURE=1 for prod
  sed -i "s|^SECRET_KEY=.*|SECRET_KEY=${SECRET}|" .env
  sed -i "s|^COOKIE_SECURE=.*|COOKIE_SECURE=1|" .env
  ok ".env created with a fresh SECRET_KEY."
  echo -e "${y}  ⚠ Edit .env now: MONGO_URI, DB_NAME, and (if using mail) SMTP_* + MAIL_ENABLED=1${n}"
  echo -e "${y}  ⚠ Then seed the DB once:  ./venv/bin/python seed.py${n}"
else
  ok ".env already present — left untouched."
fi

# ── optional: install systemd unit ──
if [ "${1:-}" = "--install-service" ]; then
  [ "$(id -u)" -eq 0 ] || { err "--install-service needs sudo."; exit 1; }
  info "Writing /etc/systemd/system/${SERVICE}.service (port ${PORT})…"
  cat > "/etc/systemd/system/${SERVICE}.service" << UNIT
[Unit]
Description=sudosudev API
After=network.target mongod.service

[Service]
WorkingDirectory=${API_DIR}
EnvironmentFile=${API_DIR}/.env
ExecStart=${API_DIR}/venv/bin/gunicorn -w 2 -b 127.0.0.1:${PORT} run:app
Restart=always
User=${RUN_USER}
Group=${RUN_USER}

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable --now "$SERVICE"
  ok "Service ${SERVICE} installed & started on 127.0.0.1:${PORT}."
fi

# ── optional: restart ──
if [ "${1:-}" = "--restart" ]; then
  info "Restarting ${SERVICE}…"
  sudo systemctl restart "$SERVICE"
  ok "${SERVICE} restarted."
fi

ok "Backend ready."
echo "  Health check:  curl http://127.0.0.1:${PORT}/api/health"