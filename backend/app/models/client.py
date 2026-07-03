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
    from flask import current_app
    projects = doc.get('projects', [])
    for p in projects:
        if 'billing' not in p:
            p['billing'] = {'total': 0.0, 'currency': 'ILS', 'payments': []}
    bank = {}
    try:
        bank = current_app.config.get('BANK', {})
    except Exception:
        pass
    return {
        'client': {
            'name': display_name(doc),
            'firstName': doc.get('firstName', ''),
            'lastName': doc.get('lastName', ''),
            'company': doc.get('company', ''),
        },
        'projects': projects,
        'bank': bank,
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

VALID_CURRENCY = ('ILS', 'EUR', 'USD')

def _num(v, default=0.0):
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return default

def normalize_billing(b):
    b = b or {}
    cur = b.get('currency') if b.get('currency') in VALID_CURRENCY else 'ILS'
    return {
        'total': _num(b.get('total'), 0.0),
        'currency': cur,
        'payments': normalize_payments(b.get('payments')),
    }

def normalize_payments(pays):
    out = []
    for p in pays or []:
        out.append({
            'label': (p.get('label') or '').strip(),
            'amount': _num(p.get('amount'), 0.0),
            'status': p.get('status') if p.get('status') in ('paid', 'pending') else 'pending',
            'dueDate': (p.get('dueDate') or '').strip(),
            'paidDate': (p.get('paidDate') or '').strip(),
        })
    return out

def add_project(email, name, description, steps, url='', billing=None):
    project = {'name': (name or '').strip(),
               'description': (description or '').strip(),
               'url': (url or '').strip(),
               'billing': normalize_billing(billing),
               'steps': normalize_steps(steps)}
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {'projects': project}}).matched_count

def update_project(email, pi, name=None, description=None, url=None,
                   total=None, currency=None):
    fields = {}
    if name        is not None: fields[f'projects.{pi}.name'] = name.strip()
    if description is not None: fields[f'projects.{pi}.description'] = description.strip()
    if url         is not None: fields[f'projects.{pi}.url'] = url.strip()
    if total       is not None: fields[f'projects.{pi}.billing.total'] = _num(total, 0.0)
    if currency in VALID_CURRENCY: fields[f'projects.{pi}.billing.currency'] = currency
    if not fields: return 0
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'}, {'$set': fields}).matched_count


# ── payments (admin) ──
def _project(email, pi):
    c = by_email(email)
    if not c: return None, None
    projects = c.get('projects', [])
    if pi < 0 or pi >= len(projects): return c, None
    return c, projects[pi]

def add_payment(email, pi, label, amount, due_date='', status='pending'):
    pay = {'label': (label or '').strip(), 'amount': _num(amount, 0.0),
           'status': status if status in ('paid', 'pending') else 'pending',
           'dueDate': (due_date or '').strip(), 'paidDate': ''}
    # ensure billing exists (older projects created before billing)
    c, proj = _project(email, pi)
    if proj is None: return None
    if 'billing' not in proj:
        extensions.db.clients.update_one(
            {'email': email.lower(), 'role': 'client'},
            {'$set': {f'projects.{pi}.billing': {'total': 0.0, 'currency': 'ILS', 'payments': []}}})
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'},
        {'$push': {f'projects.{pi}.billing.payments': pay}}).matched_count

def set_payment(email, pi, idx, label=None, amount=None, status=None, due_date=None):
    fields = {}
    base = f'projects.{pi}.billing.payments.{idx}'
    if label  is not None: fields[f'{base}.label'] = label.strip()
    if amount is not None: fields[f'{base}.amount'] = _num(amount, 0.0)
    if due_date is not None: fields[f'{base}.dueDate'] = due_date.strip()
    if status in ('paid', 'pending'):
        fields[f'{base}.status'] = status
        fields[f'{base}.paidDate'] = datetime.now(timezone.utc).strftime('%Y-%m-%d') if status == 'paid' else ''
    if not fields: return 0
    return extensions.db.clients.update_one(
        {'email': email.lower(), 'role': 'client'}, {'$set': fields}).matched_count

def delete_payment(email, pi, idx):
    c, proj = _project(email, pi)
    if proj is None: return None
    pays = proj.get('billing', {}).get('payments', [])
    if idx < 0 or idx >= len(pays): return None
    pays.pop(idx)
    extensions.db.clients.update_one(
        {'_id': c['_id']}, {'$set': {f'projects.{pi}.billing.payments': pays}})
    return True

def get_payment(doc, pi, idx):
    try:
        return doc['projects'][pi]['billing']['payments'][idx]
    except (IndexError, KeyError, TypeError):
        return None

def billing_summary(project):
    """Return (total, paid, remaining, currency) for a project dict."""
    b = project.get('billing') or {}
    total = _num(b.get('total'), 0.0)
    paid = sum(_num(p.get('amount'), 0.0) for p in b.get('payments', []) if p.get('status') == 'paid')
    return total, round(paid, 2), round(total - paid, 2), b.get('currency', 'ILS')

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