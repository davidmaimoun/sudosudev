"""SMTP mailer with nice HTML emails (sudosudev dark/cyan theme).

.env keys:
  MAIL_ENABLED=1
  SMTP_HOST=smtp.gmail.com        # or smtp-mail.outlook.com
  SMTP_PORT=587
  SMTP_USER=sudosudev.team@gmail.com
  SMTP_PASS=<app password>        # Gmail: an App Password (2FA on)
  MAIL_FROM=sudosudev <sudosudev.team@gmail.com>
  APP_URL=https://sudosudev.com/app
  ADMIN_EMAIL=sudosudev.team@gmail.com
"""
import os, smtplib, ssl
from email.message import EmailMessage

STATUS_LABEL = {'done': 'Done', 'in_progress': 'In progress', 'todo': 'Not started'}
STATUS_COLOR = {'done': '#2dd4a0', 'in_progress': '#56cffc', 'todo': '#9bc8ee'}


def is_enabled():
    return os.environ.get('MAIL_ENABLED', '0') == '1'


# ── HTML template (inline styles for email-client compatibility) ──
def _shell(title, intro_html, button=None, accent='#56cffc'):
    """button = (label, url) or None."""
    btn_html = ''
    if button:
        label, url = button
        btn_html = (
            f'<tr><td style="padding:8px 0 4px;">'
            f'<a href="{url}" style="display:inline-block;background:{accent};color:#040912;'
            f'font-family:\'Courier New\',monospace;font-weight:700;font-size:13px;letter-spacing:1px;'
            f'text-decoration:none;padding:13px 26px;border-radius:4px;">{label}</a>'
            f'</td></tr>'
        )
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#040912;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#040912;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0d1929;border:1px solid rgba(86,207,252,.18);border-radius:10px;overflow:hidden;">
    <tr><td style="height:3px;background:linear-gradient(90deg,#56cffc,#2dd4a0);"></td></tr>
    <tr><td style="padding:30px 34px 8px;">
      <div style="font-family:'Courier New',monospace;font-size:15px;letter-spacing:1px;color:#ddeeff;">
        <span style="color:#56cffc;">sudo</span>su<span style="color:#2dd4a0;">dev</span>
      </div>
    </td></tr>
    <tr><td style="padding:6px 34px 0;">
      <h1 style="margin:0 0 14px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:21px;font-weight:700;color:#ddeeff;">{title}</h1>
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(196,226,255,.82);">
        {intro_html}
      </div>
    </td></tr>
    <tr><td style="padding:18px 34px 34px;">
      <table role="presentation" cellpadding="0" cellspacing="0">{btn_html}</table>
    </td></tr>
    <tr><td style="padding:18px 34px;border-top:1px solid rgba(86,207,252,.12);">
      <div style="font-family:'Courier New',monospace;font-size:11px;color:rgba(155,200,238,.45);letter-spacing:.5px;">
        sudosudev · full-stack web &amp; bioinformatics studio
      </div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>"""


def send(to_email, subject, body, html=None):
    if not is_enabled():
        print(f"[mail disabled] would send to {to_email}: {subject}")
        return False
    host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    port = int(os.environ.get('SMTP_PORT', '587'))
    user = os.environ['SMTP_USER']
    pwd  = os.environ['SMTP_PASS']
    sender = os.environ.get('MAIL_FROM', user)

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = to_email
    msg.set_content(body)                       # plain-text fallback
    if html:
        msg.add_alternative(html, subtype='html')

    ctx = ssl.create_default_context()
    with smtplib.SMTP(host, port) as s:
        s.starttls(context=ctx)
        s.login(user, pwd)
        s.send_message(msg)
    return True


def _login_url():
    return os.environ.get('APP_URL', 'https://sudosudev.com/app') + '/login'


# ── client: a step now needs their action ──
def notify_client_step_action(client_email, client_name, project_name, step_title, note=''):
    subject = f"[sudosudev] Your action is needed — {project_name}"
    body = (f"Hi {client_name},\n\nA step now needs your action on \"{project_name}\":\n"
            f"  • {step_title}\n")
    if note:
        body += f"\nNote: {note}\n"
    body += f"\nOpen your space: {_login_url()}\n\n— sudosudev"
    note_html = (f"<div style=\"margin-top:10px;font-size:13px;color:rgba(196,226,255,.7);\">{note}</div>") if note else ""
    intro = (f"Hi <b style=\"color:#ddeeff;\">{client_name}</b>,<br><br>"
             f"A step now needs your action on <b style=\"color:#ddeeff;\">{project_name}</b>:"
             f"<div style=\"margin:16px 0;padding:14px 16px;background:#070e1d;border-left:3px solid #f87a8f;border-radius:0 6px 6px 0;\">"
             f"<span style=\"color:#ddeeff;\">{step_title}</span>{note_html}</div>"
             f"Open your space to see the details.")
    html = _shell("Your action is needed", intro, button=("OPEN MY SPACE →", _login_url()), accent='#f87a8f')
    return send(client_email, subject, body, html)


# ── client: a step status changed ──
def notify_status_change(client_email, client_name, project_name, step_title, status):
    label = STATUS_LABEL.get(status, status)
    color = STATUS_COLOR.get(status, '#56cffc')
    subject = f"[sudosudev] {project_name} — update"
    body = (f"Hi {client_name},\n\nUpdate on \"{project_name}\":\n  • {step_title} → {label}\n\n"
            f"Follow your project: {_login_url()}\n\n— sudosudev")
    intro = (f"Hi <b style=\"color:#ddeeff;\">{client_name}</b>,<br><br>"
             f"There's an update on your project <b style=\"color:#ddeeff;\">{project_name}</b>:"
             f"<div style=\"margin:16px 0;padding:14px 16px;background:#070e1d;border-left:3px solid {color};border-radius:0 6px 6px 0;\">"
             f"<span style=\"color:#ddeeff;\">{step_title}</span><br>"
             f"<span style=\"font-family:'Courier New',monospace;font-size:12px;color:{color};text-transform:uppercase;letter-spacing:1px;\">{label}</span>"
             f"</div>")
    html = _shell("Project update", intro, button=("VIEW PROGRESS →", _login_url()))
    return send(client_email, subject, body, html)


# ── client: a new task was assigned to them ──
def notify_client_new_task(client_email, client_name, project_name, step_title, task_title, note=''):
    subject = f"[sudosudev] A task for you — {project_name}"
    body = (f"Hi {client_name},\n\nA new task needs your action on \"{project_name}\":\n"
            f"  • {task_title}  (step: {step_title})\n")
    if note:
        body += f"\nNote: {note}\n"
    body += f"\nOpen your space: {_login_url()}\n\n— sudosudev"
    note_html = (f"<div style=\"margin-top:10px;font-size:13px;color:rgba(196,226,255,.7);\">{note}</div>") if note else ""
    intro = (f"Hi <b style=\"color:#ddeeff;\">{client_name}</b>,<br><br>"
             f"A new task needs your action on <b style=\"color:#ddeeff;\">{project_name}</b>:"
             f"<div style=\"margin:16px 0;padding:14px 16px;background:#070e1d;border-left:3px solid #f87a8f;border-radius:0 6px 6px 0;\">"
             f"<span style=\"color:#ddeeff;\">{task_title}</span><br>"
             f"<span style=\"font-family:'Courier New',monospace;font-size:11px;color:rgba(155,200,238,.55);\">in: {step_title}</span>"
             f"{note_html}</div>"
             f"Mark it done from your space once handled.")
    html = _shell("A task for you", intro, button=("OPEN MY SPACE →", _login_url()), accent='#f87a8f')
    return send(client_email, subject, body, html)


# ── admin: client completed a substep ──
def notify_admin_substep_done(client_name, client_email, project_name,
                              step_title, substep_title, client_note=''):
    admin_to = os.environ.get('ADMIN_EMAIL') or os.environ.get('SMTP_USER')
    if not admin_to:
        print('[mail] no ADMIN_EMAIL set, skipping admin notify')
        return False
    subject = f"[sudosudev] {client_name} completed a task — {project_name}"
    body = (f"{client_name} ({client_email}) marked a sub-task as done.\n\n"
            f"  Project : {project_name}\n  Step    : {step_title}\n  Task    : {substep_title}\n")
    if client_note:
        body += f"\n  Client note:\n  \"{client_note}\"\n"
    body += "\n— sudosudev"
    note_html = (f"<div style=\"margin-top:12px;padding:12px 14px;background:#070e1d;border-left:3px solid #fbbf24;border-radius:0 6px 6px 0;font-size:13px;color:rgba(196,226,255,.8);\">“{client_note}”</div>") if client_note else ""
    intro = (f"<b style=\"color:#ddeeff;\">{client_name}</b> "
             f"<span style=\"color:rgba(155,200,238,.6);\">({client_email})</span> completed a task."
             f"<div style=\"margin:16px 0;padding:14px 16px;background:#070e1d;border-left:3px solid #2dd4a0;border-radius:0 6px 6px 0;\">"
             f"<span style=\"color:#ddeeff;\">{substep_title}</span><br>"
             f"<span style=\"font-family:'Courier New',monospace;font-size:11px;color:rgba(155,200,238,.55);\">{project_name} · {step_title}</span>"
             f"{note_html}</div>")
    html = _shell("Task completed", intro, accent='#2dd4a0')
    return send(admin_to, subject, body, html)


# ── recovery: link to regenerate ID ──
def send_recovery_link(client_email, client_name, link, ttl_min=10):
    subject = "[sudosudev] Recover your access ID"
    body = (f"Hi {client_name},\n\nYou asked to regenerate your client ID.\n"
            f"Click within {ttl_min} minutes:\n{link}\n\n"
            f"If you didn't request this, ignore this email.\n\n— sudosudev")
    intro = (f"Hi <b style=\"color:#ddeeff;\">{client_name}</b>,<br><br>"
             f"You asked to regenerate your access ID. This link is valid for "
             f"<b style=\"color:#56cffc;\">{ttl_min} minutes</b>.<br><br>"
             f"<span style=\"font-size:12px;color:rgba(155,200,238,.55);\">"
             f"If you didn't request this, just ignore this email — your current ID stays valid.</span>")
    html = _shell("Recover your access ID", intro, button=("GENERATE A NEW ID →", link))
    return send(client_email, subject, body, html)


# ── new client ID (after admin or self regeneration) ──
def send_new_client_id(client_email, client_name, client_id, app_url=None):
    subject = "[sudosudev] Your new access ID"
    body = (f"Hi {client_name},\n\nYour new client ID:\n    {client_id}\n\n"
            f"Sign in: {_login_url()}\n\nNote: your previous ID no longer works.\n\n— sudosudev")
    intro = (f"Hi <b style=\"color:#ddeeff;\">{client_name}</b>,<br><br>"
             f"Here is your new client ID:"
             f"<div style=\"margin:16px 0;padding:18px;background:#070e1d;border:1px solid rgba(86,207,252,.28);border-radius:6px;text-align:center;\">"
             f"<span style=\"font-family:'Courier New',monospace;font-size:26px;letter-spacing:5px;color:#56cffc;\">{client_id}</span>"
             f"</div>"
             f"<span style=\"font-size:12px;color:rgba(155,200,238,.55);\">Your previous ID no longer works.</span>")
    html = _shell("Your new access ID", intro, button=("SIGN IN →", _login_url()))
    return send(client_email, subject, body, html)

# ── billing ──
CURRENCY_SYMBOL = {'ILS': '₪', 'EUR': '€', 'USD': '$'}

def _money(amount, currency='ILS'):
    sym = CURRENCY_SYMBOL.get(currency, '')
    try:
        n = float(amount)
    except (TypeError, ValueError):
        n = 0.0
    s = f"{n:,.2f}".rstrip('0').rstrip('.') if n % 1 else f"{int(n):,}"
    return f"{sym}{s}"


def notify_project_created(client_email, client_name, project_name, description,
                           total, currency, steps_count):
    subject = f"[sudosudev] New project — {project_name}"
    total_str = _money(total, currency)
    body = (f"Hi {client_name},\n\nWe've set up your project \"{project_name}\".\n\n"
            f"  Steps planned : {steps_count}\n"
            f"  Estimated cost: {total_str}\n")
    if description:
        body += f"\n{description}\n"
    body += (f"\nThis estimate may vary depending on your needs along the way.\n\n"
             f"Follow everything here: {_login_url()}\n\n— sudosudev")
    desc_html = (f"<div style=\"margin-top:6px;font-size:13px;color:rgba(196,226,255,.7);\">{description}</div>") if description else ""
    intro = (f"Hi <b style=\"color:#ddeeff;\">{client_name}</b>,<br><br>"
             f"We've set up your project <b style=\"color:#ddeeff;\">{project_name}</b>.{desc_html}"
             f"<div style=\"margin:16px 0;padding:16px;background:#070e1d;border:1px solid rgba(86,207,252,.22);border-radius:6px;\">"
             f"<table style=\"width:100%;font-size:14px;color:#c4e2ff;\">"
             f"<tr><td style=\"padding:3px 0;\">Steps planned</td><td style=\"text-align:right;color:#ddeeff;\">{steps_count}</td></tr>"
             f"<tr><td style=\"padding:3px 0;\">Estimated cost</td><td style=\"text-align:right;color:#56cffc;font-weight:700;\">{total_str}</td></tr>"
             f"</table></div>"
             f"<span style=\"font-size:12px;color:rgba(155,200,238,.55);\">"
             f"This estimate may vary depending on your needs along the way.</span>")
    html = _shell("Your project is ready", intro, button=("FOLLOW YOUR PROJECT →", _login_url()))
    return send(client_email, subject, body, html)


def send_payment_reminder(client_email, client_name, project_name,
                          label, amount, currency, due_date, remaining):
    from flask import current_app
    try:
        bank = current_app.config.get('BANK', {})
    except Exception:
        bank = {}
    amt = _money(amount, currency)
    rem = _money(remaining, currency)
    subject = f"[sudosudev] Payment reminder \u2014 {project_name}"
    body = (f"Hi {client_name},\n\nA friendly reminder for a payment on \"{project_name}\":\n\n"
            f"  {label}: {amt}\n")
    if due_date:
        body += f"  Due: {due_date}\n"
    body += f"\n  Remaining balance: {rem}\n"
    if bank:
        body += ("\nBank transfer:\n"
                 f"  Beneficiary : {bank.get('beneficiary','')}\n"
                 f"  Bank        : {bank.get('bank','')}\n"
                 f"  IBAN        : {bank.get('iban','')}\n"
                 f"  SWIFT/BIC   : {bank.get('swift','')}\n"
                 f"  Account     : {bank.get('account','')}\n"
                 f"  Reference   : {project_name}\n")
    body += "\nThank you!\n\n\u2014 sudosudev"

    due_html = (f'<tr><td style="padding:3px 0;">Due</td><td style="text-align:right;color:#ddeeff;">{due_date}</td></tr>') if due_date else ""
    bank_html = ""
    if bank:
        def row(k, v):
            return (f'<tr><td style="padding:2px 0;color:rgba(155,200,238,.6);">{k}</td>'
                    f'<td style="text-align:right;color:#ddeeff;">{v}</td></tr>')
        bank_html = (
            '<div style="margin:16px 0;padding:14px 16px;background:#070e1d;border:1px solid rgba(86,207,252,.18);border-radius:6px;">'
            '<div style="font-family:\'Courier New\',monospace;font-size:11px;color:#56cffc;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bank transfer</div>'
            '<table style="width:100%;font-size:13px;color:#c4e2ff;font-family:\'Courier New\',monospace;">'
            + row('Beneficiary', bank.get('beneficiary',''))
            + row('Bank', bank.get('bank',''))
            + row('IBAN', bank.get('iban',''))
            + row('SWIFT/BIC', bank.get('swift',''))
            + row('Account', bank.get('account',''))
            + row('Reference', project_name)
            + '</table></div>')
    intro = (f'Hi <b style="color:#ddeeff;">{client_name}</b>,<br><br>'
             f'A friendly reminder for a payment on <b style="color:#ddeeff;">{project_name}</b>:'
             f'<div style="margin:16px 0;padding:16px;background:#070e1d;border-left:3px solid #fbbf24;border-radius:0 6px 6px 0;">'
             f'<table style="width:100%;font-size:14px;color:#c4e2ff;">'
             f'<tr><td style="padding:3px 0;">{label}</td><td style="text-align:right;color:#fbbf24;font-weight:700;">{amt}</td></tr>'
             f'{due_html}'
             f'<tr><td style="padding:3px 0;border-top:1px solid rgba(255,255,255,.08);">Remaining balance</td>'
             f'<td style="text-align:right;color:#ddeeff;border-top:1px solid rgba(255,255,255,.08);">{rem}</td></tr>'
             f'</table></div>'
             f'{bank_html}'
             f'<div style="margin-top:6px;">Thank you!</div>')
    html = _shell("Payment reminder", intro, button=("VIEW YOUR PROJECT \u2192", _login_url()), accent='#fbbf24')
    return send(client_email, subject, body, html)