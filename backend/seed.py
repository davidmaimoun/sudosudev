from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from bson.errors import InvalidId

from app import extensions
from app.services.security import gen_client_id

VALID_STATUS = ('done', 'in_progress', 'todo')


# ── reads ──
def by_email(email):
    return extensions.db.clients.find_one({'email': email.lower(), 'role': 'client'})

def by_id(uid):
    try:
        return extensions.db.clients.find_one({'_id': ObjectId(uid)})
    except (InvalidId, TypeError):
        return None

def all_summaries():
    out = []
    for c in extensions.db.clients.find({'role': 'client'}).sort('name', 1):
        projects = c.get('projects', [])
        out.append({
            'email': c['email'], 'name': c.get('name'),
            'projects': len(projects),
            'steps': sum(len(p.get('steps', [])) for p in projects),
        })
    return out


# ── auth ──
def verify(email, client_id):
    doc = by_email(email)
    if doc and check_password_hash(doc.get('clientIdHash', ''), client_id):
        return doc
    return None

def public(doc):
    return {'client': {'name': doc.get('name')}, 'projects': doc.get('projects', [])}


# ── writes ──
def create(name, email):
    cid = gen_client_id()
    extensions.db.clients.insert_one({
        'name': name, 'email': email.lower(), 'role': 'client',
        'clientIdHash': generate_password_hash(cid),
        'projects': [], 'createdAt': datetime.now(timezone.utc),
    })
    return cid

def delete(email):
    return extensions.db.clients.delete_one({'email': email.lower(), 'role': 'client'}).deleted_count

def regenerate_id(email):
    cid = gen_client_id()
    res = extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$set': {'clientIdHash': generate_password_hash(cid)}})
    return cid if res.matched_count else None


# ── projects / steps ──
def normalize_steps(steps):
    out = []
    for i, s in enumerate(steps or []):
        out.append({
            'title': (s.get('title') or '').strip(),
            'eta': (s.get('eta') or '').strip(),
            'note': (s.get('note') or '').strip(),
            'needsClient': bool(s.get('needsClient', False)),
            'status': s.get('status') if s.get('status') in VALID_STATUS
                      else ('in_progress' if i == 0 else 'todo'),
        })
    return out

def add_project(email, name, description, steps):
    project = {'name': (name or '').strip(),
               'description': (description or '').strip(),
               'steps': normalize_steps(steps)}
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {'projects': project}}).matched_count

def delete_project(email, pi):
    c = by_email(email)
    if not c: return None
    projects = c.get('projects', [])
    if pi < 0 or pi >= len(projects): return None
    projects.pop(pi)
    extensions.db.clients.update_one({'_id': c['_id']}, {'$set': {'projects': projects}})
    return True

def set_step_status(email, pi, si, status):
    if status not in VALID_STATUS: return 'bad_status'
    res = extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$set': {f'projects.{pi}.steps.{si}.status': status}})
    return res.matched_count

def update_step(email, pi, si, title=None, eta=None, note=None, needs_client=None):
    fields = {}
    if title is not None: fields[f'projects.{pi}.steps.{si}.title'] = title.strip()
    if eta   is not None: fields[f'projects.{pi}.steps.{si}.eta'] = eta.strip()
    if note  is not None: fields[f'projects.{pi}.steps.{si}.note'] = note.strip()
    if needs_client is not None: fields[f'projects.{pi}.steps.{si}.needsClient'] = bool(needs_client)
    if not fields: return 0
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'}, {'$set': fields}).matched_count

def add_step(email, pi, title, eta, status='todo', note='', needs_client=False):
    step = {'title': (title or '').strip(), 'eta': (eta or '').strip(),
            'note': (note or '').strip(), 'needsClient': bool(needs_client),
            'status': status if status in VALID_STATUS else 'todo'}
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {f'projects.{pi}.steps': step}}).matched_count

def delete_step(email, pi, si):
    c = by_email(email)
    if not c: return None
    projects = c.get('projects', [])
    if pi < 0 or pi >= len(projects): return None
    steps = projects[pi].get('steps', [])
    if si < 0 or si >= len(steps): return None
    steps.pop(si)
    extensions.db.clients.update_one({'_id': c['_id']}, {'$set': {f'projects.{pi}.steps': steps}})
    return True