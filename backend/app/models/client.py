from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from bson.errors import InvalidId

from .. import extensions
from ..services.security import gen_client_id

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
    for c in extensions.db.clients.find({'role': 'client'}).sort('lastName', 1):
        projects = c.get('projects', [])
        out.append({
            'email': c['email'],
            'name': display_name(c),
            'firstName': c.get('firstName', ''),
            'lastName': c.get('lastName', ''),
            'company': c.get('company', ''),
            'projects': len(projects),
            'steps': sum(len(p.get('steps', [])) for p in projects),
        })
    return out


def display_name(c):
    """Best human label: 'First Last' > company > legacy name > email."""
    fn, ln = c.get('firstName', ''), c.get('lastName', '')
    full = (fn + ' ' + ln).strip()
    return full or c.get('company') or c.get('name') or c.get('email')


# ── auth ──
def verify(email, client_id):
    doc = by_email(email)
    if doc and check_password_hash(doc.get('clientIdHash', ''), client_id):
        return doc
    return None

def public(doc):
    return {
        'client': {
            'name': display_name(doc),
            'firstName': doc.get('firstName', ''),
            'lastName': doc.get('lastName', ''),
            'company': doc.get('company', ''),
        },
        'projects': doc.get('projects', []),
    }


# ── writes ──
def create(first_name, last_name, email, company='', phone='', address=''):
    cid = gen_client_id()
    extensions.db.clients.insert_one({
        'firstName': (first_name or '').strip(),
        'lastName': (last_name or '').strip(),
        'company': (company or '').strip(),
        'phone': (phone or '').strip(),
        'address': (address or '').strip(),
        'email': email.lower(), 'role': 'client',
        'clientIdHash': generate_password_hash(cid),
        'projects': [], 'createdAt': datetime.now(timezone.utc),
    })
    return cid

def update_profile(email, fields):
    allowed = ('firstName', 'lastName', 'company', 'phone', 'address')
    upd = {k: (fields.get(k) or '').strip() for k in allowed if k in fields}
    if not upd:
        return 0
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'}, {'$set': upd}).matched_count

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
            'substeps': normalize_substeps(s.get('substeps')),
            'status': s.get('status') if s.get('status') in VALID_STATUS
                      else ('in_progress' if i == 0 else 'todo'),
        })
    return out

def normalize_substeps(subs):
    out = []
    for s in subs or []:
        out.append({
            'title': (s.get('title') or '').strip(),
            'owner': s.get('owner') if s.get('owner') in ('admin', 'client') else 'admin',
            'done': bool(s.get('done', False)),
            'clientNote': (s.get('clientNote') or '').strip(),
        })
    return out

def add_project(email, name, description, steps, url=''):
    project = {'name': (name or '').strip(),
               'description': (description or '').strip(),
               'url': (url or '').strip(),
               'steps': normalize_steps(steps)}
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {'projects': project}}).matched_count

def update_project(email, pi, name=None, description=None, url=None):
    fields = {}
    if name        is not None: fields[f'projects.{pi}.name'] = name.strip()
    if description is not None: fields[f'projects.{pi}.description'] = description.strip()
    if url         is not None: fields[f'projects.{pi}.url'] = url.strip()
    if not fields: return 0
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'}, {'$set': fields}).matched_count

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
            'substeps': [],
            'status': status if status in VALID_STATUS else 'todo'}
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {f'projects.{pi}.steps': step}}).matched_count


# ── substeps (admin) ──
def add_substep(email, pi, si, title, owner='admin'):
    sub = {'title': (title or '').strip(),
           'owner': owner if owner in ('admin', 'client') else 'admin',
           'done': False, 'clientNote': ''}
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {f'projects.{pi}.steps.{si}.substeps': sub}}).matched_count

def delete_substep(email, pi, si, bi):
    c = by_email(email)
    if not c: return None
    try:
        subs = c['projects'][pi]['steps'][si].get('substeps', [])
    except (IndexError, KeyError):
        return None
    if bi < 0 or bi >= len(subs): return None
    subs.pop(bi)
    extensions.db.clients.update_one(
        {'_id': c['_id']}, {'$set': {f'projects.{pi}.steps.{si}.substeps': subs}})
    return True

def set_substep(email, pi, si, bi, done=None, title=None, owner=None, client_note=None):
    fields = {}
    p = f'projects.{pi}.steps.{si}.substeps.{bi}'
    if done  is not None: fields[f'{p}.done'] = bool(done)
    if title is not None: fields[f'{p}.title'] = title.strip()
    if owner in ('admin', 'client'): fields[f'{p}.owner'] = owner
    if client_note is not None: fields[f'{p}.clientNote'] = client_note.strip()
    if not fields: return 0
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'}, {'$set': fields}).matched_count

def get_substep(doc, pi, si, bi):
    """Helper to read a substep safely (for ownership checks / notifications)."""
    try:
        return doc['projects'][pi]['steps'][si]['substeps'][bi]
    except (IndexError, KeyError, TypeError):
        return None

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