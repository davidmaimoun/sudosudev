from flask import Blueprint, request, jsonify, session
from ..models import client as Client, admin as Admin

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
