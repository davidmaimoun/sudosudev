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
    name, email = (d.get('name') or '').strip(), (d.get('email') or '').strip().lower()
    if not name or not email:
        return jsonify(error='name and email required'), 400
    if Client.by_email(email):
        return jsonify(error='email already exists'), 409
    cid = Client.create(name, email)
    return jsonify(ok=True, email=email, clientId=cid)


@bp.get('/clients/<email>')
@require_admin
def get_client(email):
    c = Client.by_email(email)
    if not c:
        return jsonify(error='not found'), 404
    return jsonify(name=c.get('name'), email=c['email'], projects=c.get('projects', []))


@bp.delete('/clients/<email>')
@require_admin
def delete_client(email):
    return (jsonify(ok=True) if Client.delete(email) else (jsonify(error='not found'), 404))


@bp.post('/clients/<email>/regenerate-id')
@require_admin
def regenerate_id(email):
    cid = Client.regenerate_id(email)
    return jsonify(ok=True, clientId=cid) if cid else (jsonify(error='not found'), 404)


# ── projects ──
@bp.post('/clients/<email>/projects')
@require_admin
def add_project(email):
    d = request.get_json(silent=True) or {}
    ok = Client.add_project(email, d.get('name'), d.get('description'), d.get('steps'))
    return jsonify(ok=True) if ok else (jsonify(error='client not found'), 404)


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
    ok = Client.add_step(email, pi, d.get('title'), d.get('eta'), d.get('status', 'todo'))
    return jsonify(ok=True) if ok else (jsonify(error='not found'), 404)


@bp.patch('/clients/<email>/projects/<int:pi>/steps/<int:si>')
@require_admin
def update_step(email, pi, si):
    d = request.get_json(silent=True) or {}
    # status-only update (with optional email notification)
    if 'status' in d and 'title' not in d and 'eta' not in d:
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
    # title/eta edit
    r = Client.update_step(email, pi, si, d.get('title'), d.get('eta'))
    return jsonify(ok=True) if r else (jsonify(error='not found'), 404)


@bp.delete('/clients/<email>/projects/<int:pi>/steps/<int:si>')
@require_admin
def delete_step(email, pi, si):
    return jsonify(ok=True) if Client.delete_step(email, pi, si) else (jsonify(error='not found'), 404)
