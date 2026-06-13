import secrets, string
from functools import wraps
from flask import session, jsonify


def gen_client_id():
    """2 uppercase letters + 4 digits, e.g. AB1234."""
    return (''.join(secrets.choice(string.ascii_uppercase) for _ in range(2))
            + ''.join(secrets.choice(string.digits) for _ in range(4)))


def gen_admin_code():
    a = string.ascii_uppercase + string.digits
    return '-'.join(''.join(secrets.choice(a) for _ in range(4)) for _ in range(2))


def require_admin(fn):
    @wraps(fn)
    def wrapper(*a, **k):
        if session.get('role') != 'admin':
            return jsonify(error='forbidden'), 403
        return fn(*a, **k)
    return wrapper
