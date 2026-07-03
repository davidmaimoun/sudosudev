import os, secrets


def _stable_secret_key():
    """Use SECRET_KEY from env; otherwise persist one to a file so that
    ALL gunicorn workers and restarts share the same key (sessions survive)."""
    env = os.environ.get('SECRET_KEY')
    if env:
        return env
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.secret_key')
    try:
        with open(path) as f:
            return f.read().strip()
    except FileNotFoundError:
        key = secrets.token_hex(32)
        try:
            with open(path, 'w') as f:
                f.write(key)
            os.chmod(path, 0o600)
        except OSError:
            pass
        return key


class Config:
    SECRET_KEY = _stable_secret_key()
    MONGO_URI  = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    DB_NAME    = os.environ.get('DB_NAME', 'sudosudev')

    # ── bank transfer details (shown to clients + in reminder emails) ──
    # override any of these in .env when you have a real account.
    BANK = {
        'beneficiary': os.environ.get('BANK_BENEFICIARY', 'David Maimoun'),
        'bank':        os.environ.get('BANK_NAME', 'Bank Leumi'),
        'iban':        os.environ.get('BANK_IBAN', 'xxxx'),
        'swift':       os.environ.get('BANK_SWIFT', 'xxxx'),
        'account':     os.environ.get('BANK_ACCOUNT', 'xxxx'),
    }

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE   = os.environ.get('COOKIE_SECURE', '1') == '1'

    CORS_ORIGINS = [
        'http://localhost:5173', 'http://127.0.0.1:5173',
        'http://localhost:5500', 'http://127.0.0.1:5500',
    ]