from flask import Blueprint, request, jsonify, session
from ..models import client as Client, admin as Admin
from ..services import mailer

bp = Blueprint('auth', __name__, url_prefix='/api')


@bp.post('/login')
def login():
    data  = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    cid   = (data.get('clientId') or '').strip().upper()
    doc = Client.verify(email, cid) if email and cid else None
    if not doc:
        return jsonify(error='Invalid credentials'), 401      # generic on purpose
    session.clear()
    session['uid'], session['role'] = str(doc['_id']), 'client'
    return jsonify(Client.public(doc))


@bp.get('/me')
def me():
    if session.get('role') != 'client':
        return jsonify(error='unauthorized'), 401
    doc = Client.by_id(session.get('uid'))
    if not doc:
        session.clear()
        return jsonify(error='unauthorized'), 401
    return jsonify(Client.public(doc))


@bp.post('/logout')
def logout():
    session.clear()
    return jsonify(ok=True)


@bp.post('/admin/login')
def admin_login():
    data  = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    code  = (data.get('code') or '').strip()
    doc = Admin.verify(email, code) if email and code else None
    if not doc:
        return jsonify(error='Invalid credentials'), 401
    session.clear()
    session['uid'], session['role'] = str(doc['_id']), 'admin'
    return jsonify(ok=True, email=email)


# ── client toggles their OWN substep (and notifies the admin) ──
@bp.patch('/me/projects/<int:pi>/steps/<int:si>/substeps/<int:bi>')
def client_toggle_substep(pi, si, bi):
    if session.get('role') != 'client':
        return jsonify(error='unauthorized'), 401
    doc = Client.by_id(session.get('uid'))
    if not doc:
        session.clear()
        return jsonify(error='unauthorized'), 401

    sub = Client.get_substep(doc, pi, si, bi)
    if sub is None:
        return jsonify(error='not found'), 404
    # security: a client may only touch substeps assigned to the client
    if sub.get('owner') != 'client':
        return jsonify(error='forbidden'), 403

    d = request.get_json(silent=True) or {}
    done = d.get('done')
    note = d.get('clientNote')
    Client.set_substep(doc['email'], pi, si, bi, done=done, client_note=note)

    # notify the admin by email when the client marks something done
    mailed = False
    if done:
        try:
            proj = doc['projects'][pi]; step = proj['steps'][si]
            mailed = mailer.notify_admin_substep_done(
                client_name=Client.display_name(doc),
                client_email=doc['email'],
                project_name=proj.get('name', ''),
                step_title=step.get('title', ''),
                substep_title=sub.get('title', ''),
                client_note=(note or ''))
        except Exception as e:
            print('[mail] admin notify failed:', e)
    return jsonify(ok=True, mailed=mailed)


# ── client self-service ClientID recovery ──
import os
from ..models import recovery as Recovery
from ..models import client as ClientModel


@bp.post('/recover/request')
def recover_request():
    """Step 1: client asks for a recovery link by email."""
    email = ((request.get_json(silent=True) or {}).get('email') or '').strip().lower()
    # always answer OK (don't reveal whether an email exists)
    if email:
        token = Recovery.create(email)
        if token:
            app_url = os.environ.get('APP_URL', 'https://sudosudev.com/app')
            link = f"{app_url}/recover?email={email}&token={token}"
            client = ClientModel.by_email(email)
            try:
                mailer.send_recovery_link(email, ClientModel.display_name(client),
                                          link, Recovery.RECOVERY_TTL_MIN)
            except Exception as e:
                print('[mail] recovery link failed:', e)
    return jsonify(ok=True, ttlMin=Recovery.RECOVERY_TTL_MIN)


@bp.post('/recover/confirm')
def recover_confirm():
    """Step 2: client opens the link -> validate token, regenerate ID, email it."""
    d = request.get_json(silent=True) or {}
    email = (d.get('email') or '').strip().lower()
    token = (d.get('token') or '').strip()
    if not email or not token or not Recovery.consume(email, token):
        return jsonify(error='Lien invalide ou expiré.'), 400
    new_id = ClientModel.regenerate_id(email)
    if not new_id:
        return jsonify(error='Compte introuvable.'), 404
    client = ClientModel.by_email(email)
    try:
        mailer.send_new_client_id(email, ClientModel.display_name(client), new_id)
        emailed = True
    except Exception as e:
        print('[mail] new id failed:', e)
        emailed = False
    # also return it so the page can show it immediately
    return jsonify(ok=True, clientId=new_id, emailed=emailed)