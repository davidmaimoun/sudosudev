from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from .. import extensions


def find_by_email(email):
    return extensions.db.admins.find_one({'email': email.lower()})


def verify(email, code):
    doc = find_by_email(email)
    if doc and check_password_hash(doc.get('codeHash', ''), code):
        return doc
    return None


def upsert(email, code):
    extensions.db.admins.update_one(
        {'email': email.lower()},
        {'$set': {'role': 'admin', 'codeHash': generate_password_hash(code),
                  'createdAt': datetime.now(timezone.utc)}},
        upsert=True,
    )
