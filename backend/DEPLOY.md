# sudosudev — deploy (landing + react app + flask api)

```
/var/www/sudosu/            ← git repo
├── landing/                ← static showcase  (nginx root)
├── frontend/               ← React app  →  npm run build  →  frontend/dist/
└── backend/                ← Flask API package (run.py, app/, seed.py)
```
Domain map: `sudosudev.com` = landing · `/app` = React · `/api` = Flask (gunicorn :8001).

## 1. Backend (Flask API)
```bash
sudo mkdir -p /var/www/sudosudev-api
sudo cp -r backend/* /var/www/sudosudev-api/      # run.py, app/, seed.py, requirements.txt
cd /var/www/sudosudev-api
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env
echo "SECRET_KEY=$(openssl rand -hex 32)"          # paste into .env
nano .env                                          # MONGO_URI, DB_NAME, (mail keys), COOKIE_SECURE=1
./venv/bin/python seed.py                          # admin + demo client (note the codes)
```

### systemd  → /etc/systemd/system/sudosudev-api.service
```ini
[Unit]
Description=sudosudev API
After=network.target mongod.service

[Service]
WorkingDirectory=/var/www/sudosudev-api
EnvironmentFile=/var/www/sudosudev-api/.env
ExecStart=/var/www/sudosudev-api/venv/bin/gunicorn -w 2 -b 127.0.0.1:8001 run:app
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload && sudo systemctl enable --now sudosudev-api
```

## 2. Frontend (React)
```bash
cd /var/www/sudosu/frontend
npm install
npm run build            # outputs frontend/dist/  (base = /app/)
```

## 3. nginx — one server block for everything
```nginx
server {
    listen 443 ssl;
    server_name sudosudev.com www.sudosudev.com;

    # landing (showcase) at the root
    root /var/www/sudosu/landing;
    index index.html;
    location / { try_files $uri $uri/ =404; }

    # React app under /app
    location /app/ {
        alias /var/www/sudosu/frontend/dist/;
        try_files $uri $uri/ /app/index.html;       # SPA fallback
    }

    # Flask API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # cache: long for media, short for css/js
    location ~* \.(?:mp4|woff2?|png|jpe?g|webp|svg|ico)$ { expires 30d; add_header Cache-Control "public"; }
    location ~* \.(?:css|js)$ { expires 1h; add_header Cache-Control "public, must-revalidate"; }

    # ssl_certificate ... (Certbot)
}
server { listen 80; server_name sudosudev.com www.sudosudev.com; return 301 https://$host$request_uri; }
```
```bash
sudo nginx -t && sudo systemctl reload nginx
```
The landing's `robots.txt` already blocks `/app` and `/api`, and the React `index.html` is `noindex`.

## 4. Email notifications (optional)
In `.env`, set `MAIL_ENABLED=1` and the SMTP keys. Gmail recommended:
1. Enable 2-Step Verification on the Gmail account.
2. Create an **App Password** (Google account → Security → App passwords).
3. Put it in `SMTP_PASS`, with `SMTP_USER` = the Gmail address.
(Outlook: `SMTP_HOST=smtp-mail.outlook.com`, but Gmail App Passwords are more reliable.)
When `MAIL_ENABLED=0`, status changes still work — the email is just skipped (logged).

## 5. Updating later
```bash
sudo bash /var/www/sudosu/update_sudosudev.sh            # pull + build front + restart api + reload nginx
sudo bash /var/www/sudosu/update_sudosudev.sh --no-build # backend-only change
```

## Run locally (dev)
```bash
cd backend  && python run.py            # API  :8000
cd frontend && npm run dev              # app  :5173/app/   (Vite proxies /api -> :8000)
```
Admin: /app/admin/login (sudosudev@outlook.com / 1234) · Client: /app/login (demo + seeded ClientID).
