# sudosudev — client/admin app (React + Vite)

Stack: React Router · Tailwind (your charte) · Axios · Zustand · lucide-react · sonner (toasts).

```
sudosu/
├── landing/    ← static showcase site (unchanged)
├── frontend/   ← THIS app (client space + admin)
└── backend/    ← Flask API
```

## Dev (two terminals)
```bash
# 1) API
cd backend && python app.py            # http://localhost:8000

# 2) React app
cd frontend && npm install && npm run dev   # http://localhost:5173/app/
```
Vite proxies `/api` → `:8000`, so it's same-origin in the browser (no CORS pain).
Open the app at **http://localhost:5173/app/login**.
Log in with the seeded demo client (see backend/seed-credentials.txt).

Routes:
- `/app/login`     → client login
- `/app/workspace` → client projects + timeline
- `/app/admin/login`, `/app/admin` → admin (dashboard is a stub for now)

## Build (prod)
```bash
cd frontend && npm run build           # outputs to frontend/dist/  (base = /app/)
```

## nginx (prod) — landing + react app + api, all on sudosudev.com
```nginx
server {
    listen 443 ssl;
    server_name sudosudev.com www.sudosudev.com;

    # showcase site at the root
    root /var/www/sudosu/landing;
    index index.html;
    location / { try_files $uri $uri/ =404; }

    # React app under /app
    location /app/ {
        alias /var/www/sudosu/frontend/dist/;
        try_files $uri $uri/ /app/index.html;     # SPA fallback
    }

    # Flask API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ssl_certificate ... (Certbot)
}
```
Then the client space lives at **https://sudosudev.com/app/** and the API at `/api`.

Note: the landing's "Connect" buttons should point to `/app/login`.
