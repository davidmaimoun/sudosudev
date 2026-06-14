"""
Recovery tokens for client self-service ClientID regeneration.
A token is single-use and expires after RECOVERY_TTL_MIN minutes.
Flow:
  1. client requests recovery with their email
  2. we store a token (hashed) + expiry, email them a link
  3. client opens the link within the TTL -> we generate a NEW ClientID,
     update the hash, invalidate the token, and email the new ID.
"""
import os, secrets
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from .. import extensions

RECOVERY_TTL_MIN = int(os.environ.get('RECOVERY_TTL_MIN', '10'))


def _coll():
    return extensions.db.recovery_tokens


def ensure_index():
    # auto-delete expired tokens (TTL index on expiresAt)
    _coll().create_index('expiresAt', expireAfterSeconds=0)


def create(email):
    """Create a token for an existing client. Returns the raw token, or None."""
    client = extensions.db.clients.find_one({'email': email.lower(), 'role': 'client'})
    if not client:
        return None
    raw = secrets.token_urlsafe(32)
    _coll().delete_many({'email': email.lower()})       # one active token per client
    _coll().insert_one({
        'email': email.lower(),
        'tokenHash': generate_password_hash(raw),
        'createdAt': datetime.now(timezone.utc),
        'expiresAt': datetime.now(timezone.utc) + timedelta(minutes=RECOVERY_TTL_MIN),
    })
    return raw


def consume(email, raw_token):
    """Validate a token. If valid+unexpired, delete it and return True."""
    doc = _coll().find_one({'email': email.lower()})
    if not doc:
        return False
    if doc['expiresAt'].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        _coll().delete_one({'_id': doc['_id']})
        return False
    if not check_password_hash(doc.get('tokenHash', ''), raw_token):
        return False
    _coll().delete_one({'_id': doc['_id']})             # single use
    return True