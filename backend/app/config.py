import os, secrets


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    MONGO_URI  = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    DB_NAME    = os.environ.get('DB_NAME', 'sudosudev')

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE   = os.environ.get('COOKIE_SECURE', '1') == '1'

    CORS_ORIGINS = [
        'http://localhost:5173', 'http://127.0.0.1:5173',
        'http://localhost:5500', 'http://127.0.0.1:5500',
    ]
