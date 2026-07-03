from flask import Blueprint, request, jsonify
from ..models import client as Client
from ..services.security import require_admin
from ..services import mailer

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.get('/clients')
@require_admin
def list_clients():
    return jsonify(clients=Client.all_summaries())


@bp.post('/clients')
@require_admin
def create_client():
    d = request.get_json(silent=True) or {}
    first = (d.get('firstName') or '').strip()
    last  = (d.get('lastName') or '').strip()
    email = (d.get('email') or '').strip().lower()
    if not first or not last or not email:
        return jsonify(error='firstName, lastName and email required'), 400
    if Client.by_email(email):
        return jsonify(error='email already exists'), 409
    cid = Client.create(first, last, email,
                        d.get('company', ''), d.get('phone', ''), d.get('address', ''))
    mailed = False
    if d.get('notify'):
        try:
            c = Client.by_email(email)
            mailed = mailer.send_welcome(email, Client.display_name(c), cid)
        except Exception as e:
            print('[mail] welcome failed:', e)
    return jsonify(ok=True, email=email, clientId=cid, mailed=mailed)


@bp.get('/clients/<email>')
@require_admin
def get_client(email):
    c = Client.by_email(email)
    if not c:
        return jsonify(error='not found'), 404
    return jsonify(
        name=Client.display_name(c), email=c['email'],
        firstName=c.get('firstName', ''), lastName=c.get('lastName', ''),
        company=c.get('company', ''), phone=c.get('phone', ''),
        address=c.get('address', ''),
        projects=c.get('projects', []))


@bp.patch('/clients/<email>')
@require_admin
def update_client(email):
    d = request.get_json(silent=True) or {}
    r = Client.update_profile(email, d)
    return jsonify(ok=True) if r else (jsonify(error='not found or no change'), 404)


@bp.delete('/clients/<email>')
@require_admin
def delete_client(email):
    return (jsonify(ok=True) if Client.delete(email) else (jsonify(error='not found'), 404))


@bp.post('/clients/<email>/regenerate-id')
@require_admin
def regenerate_id(email):
    cid = Client.regenerate_id(email)
    if not cid:
        return jsonify(error='not found'), 404
    emailed = False
    c = Client.by_email(email)
    try:
        emailed = mailer.send_new_client_id(c['email'], Client.display_name(c), cid)
    except Exception as e:
        print('[mail] regenerate notify failed:', e)
    return jsonify(ok=True, clientId=cid, emailed=emailed)


# ── projects ──
@bp.post('/clients/<email>/projects')
@require_admin
def add_project(email):
    d = request.get_json(silent=True) or {}
    billing = {'total': d.get('total'), 'currency': d.get('currency'), 'payments': []}
    ok = Client.add_project(email, d.get('name'), d.get('description'),
                            d.get('steps'), d.get('url', ''), billing)
    if not ok:
        return jsonify(error='client not found'), 404
    # optional recap email on project creation
    mailed = False
    if d.get('notify'):
        c = Client.by_email(email)
        try:
            p = c['projects'][-1]
            total, paid, remaining, cur = Client.billing_summary(p)
            mailed = mailer.notify_project_created(
                c['email'], Client.display_name(c), p.get('name', ''),
                p.get('description', ''), total, cur, len(p.get('steps', [])))
        except Exception as e:
            print('[mail] project-created notify failed:', e)
    return jsonify(ok=True, mailed=mailed)


@bp.patch('/clients/<email>/projects/<int:pi>')
@require_admin
def update_project(email, pi):
    d = request.get_json(silent=True) or {}
    r = Client.update_project(email, pi, d.get('name'), d.get('description'), d.get('url'),
                              total=d.get('total'), currency=d.get('currency'))
    return jsonify(ok=True) if r else (jsonify(error='not found or no change'), 404)


# ── payments (billing) ──
@bp.post('/clients/<email>/projects/<int:pi>/payments')
@require_admin
def add_payment(email, pi):
    d = request.get_json(silent=True) or {}
    ok = Client.add_payment(email, pi, d.get('label'), d.get('amount'),
                            d.get('dueDate', ''), d.get('status', 'pending'))
    return jsonify(ok=True) if ok else (jsonify(error='not found'), 404)


@bp.patch('/clients/<email>/projects/<int:pi>/payments/<int:idx>')
@require_admin
def update_payment(email, pi, idx):
    d = request.get_json(silent=True) or {}
    r = Client.set_payment(email, pi, idx, label=d.get('label'), amount=d.get('amount'),
                           status=d.get('status'), due_date=d.get('dueDate'))
    return jsonify(ok=True) if r else (jsonify(error='not found'), 404)


@bp.delete('/clients/<email>/projects/<int:pi>/payments/<int:idx>')
@require_admin
def delete_payment(email, pi, idx):
    return jsonify(ok=True) if Client.delete_payment(email, pi, idx) else (jsonify(error='not found'), 404)


@bp.post('/clients/<email>/projects/<int:pi>/payments/<int:idx>/remind')
@require_admin
def remind_payment(email, pi, idx):
    c = Client.by_email(email)
    if not c:
        return jsonify(error='not found'), 404
    pay = Client.get_payment(c, pi, idx)
    if pay is None:
        return jsonify(error='payment not found'), 404
    p = c['projects'][pi]
    total, paid, remaining, cur = Client.billing_summary(p)
    try:
        mailed = mailer.send_payment_reminder(
            c['email'], Client.display_name(c), p.get('name', ''),
            pay.get('label', ''), pay.get('amount', 0), cur,
            pay.get('dueDate', ''), remaining)
    except Exception as e:
        print('[mail] payment reminder failed:', e)
        mailed = False
    return jsonify(ok=True, mailed=mailed)


@bp.delete('/clients/<email>/projects/<int:pi>')
@require_admin
def delete_project(email, pi):
    return jsonify(ok=True) if Client.delete_project(email, pi) else (jsonify(error='not found'), 404)


# ── steps ──
@bp.post('/clients/<email>/projects/<int:pi>/steps')
@require_admin
def add_step(email, pi):
    d = request.get_json(silent=True) or {}
    if not (d.get('title') or '').strip():
        return jsonify(error='title required'), 400
    ok = Client.add_step(email, pi, d.get('title'), d.get('eta'), d.get('status', 'todo'), d.get('note', ''), d.get('needsClient', False))
    return jsonify(ok=True) if ok else (jsonify(error='not found'), 404)


@bp.patch('/clients/<email>/projects/<int:pi>/steps/<int:si>')
@require_admin
def update_step(email, pi, si):
    d = request.get_json(silent=True) or {}
    # status-only update (with optional email notification)
    if 'status' in d and not any(k in d for k in ('title', 'eta', 'note', 'needsClient')):
        status = d.get('status')
        r = Client.set_step_status(email, pi, si, status)
        if r == 'bad_status':
            return jsonify(error='bad status'), 400
        if not r:
            return jsonify(error='not found'), 404
        mailed = False
        if d.get('notify'):
            c = Client.by_email(email)
            try:
                p = c['projects'][pi]; st = p['steps'][si]
                mailed = mailer.notify_status_change(
                    c['email'], c.get('name', ''), p.get('name', ''), st.get('title', ''), status)
            except Exception as e:
                print('[mail] notify failed:', e)
        return jsonify(ok=True, mailed=mailed)
    # title / eta / note / needsClient edit
    r = Client.update_step(email, pi, si, d.get('title'), d.get('eta'), d.get('note'), d.get('needsClient'))
    if not r:
        return jsonify(error='not found'), 404
    mailed = False
    if d.get('needsClient') and d.get('notify'):
        c = Client.by_email(email)
        try:
            p = c['projects'][pi]; st = p['steps'][si]
            mailed = mailer.notify_client_step_action(
                c['email'], Client.display_name(c), p.get('name', ''),
                st.get('title', ''), st.get('note', ''))
        except Exception as e:
            print('[mail] step-action notify failed:', e)
    return jsonify(ok=True, mailed=mailed)


@bp.delete('/clients/<email>/projects/<int:pi>/steps/<int:si>')
@require_admin
def delete_step(email, pi, si):
    return jsonify(ok=True) if Client.delete_step(email, pi, si) else (jsonify(error='not found'), 404)


# ── substeps (admin) ──
@bp.post('/clients/<email>/projects/<int:pi>/steps/<int:si>/substeps')
@require_admin
def add_substep(email, pi, si):
    d = request.get_json(silent=True) or {}
    title = (d.get('title') or '').strip()
    if not title:
        return jsonify(error='title required'), 400
    owner = d.get('owner', 'admin')
    ok = Client.add_substep(email, pi, si, title, owner)
    if not ok:
        return jsonify(error='not found'), 404
    mailed = False
    if d.get('notify') and owner == 'client':
        c = Client.by_email(email)
        try:
            step = c['projects'][pi]['steps'][si]
            mailed = mailer.notify_client_new_task(
                c['email'], Client.display_name(c),
                c['projects'][pi].get('name', ''), step.get('title', ''),
                title, d.get('note', ''))
        except Exception as e:
            print('[mail] new-task notify failed:', e)
    return jsonify(ok=True, mailed=mailed)


@bp.patch('/clients/<email>/projects/<int:pi>/steps/<int:si>/substeps/<int:bi>')
@require_admin
def update_substep(email, pi, si, bi):
    d = request.get_json(silent=True) or {}
    r = Client.set_substep(email, pi, si, bi,
                           done=d.get('done'), title=d.get('title'),
                           owner=d.get('owner'), client_note=d.get('clientNote'))
    return jsonify(ok=True) if r else (jsonify(error='not found'), 404)


@bp.delete('/clients/<email>/projects/<int:pi>/steps/<int:si>/substeps/<int:bi>')
@require_admin
def delete_substep(email, pi, si, bi):
    return jsonify(ok=True) if Client.delete_substep(email, pi, si, bi) else (jsonify(error='not found'), 404)