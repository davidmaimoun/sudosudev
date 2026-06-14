"""Simple SMTP mailer. Works with Gmail (recommended) or Outlook.

.env keys:
  MAIL_ENABLED=1
  SMTP_HOST=smtp.gmail.com        # or smtp-mail.outlook.com
  SMTP_PORT=587
  SMTP_USER=sudosudev.app@gmail.com
  SMTP_PASS=<app password>        # Gmail: an App Password (2FA on)
  MAIL_FROM=sudosudev <sudosudev.app@gmail.com>
  APP_URL=https://sudosudev.com/app
"""
import os, smtplib, ssl
from email.message import EmailMessage

STATUS_LABEL = {'done': 'Done', 'in_progress': 'In progress', 'todo': 'Not started'}


def is_enabled():
    return os.environ.get('MAIL_ENABLED', '0') == '1'


def send(to_email, subject, body):
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
    msg.set_content(body)

    ctx = ssl.create_default_context()
    with smtplib.SMTP(host, port) as s:
        s.starttls(context=ctx)
        s.login(user, pwd)
        s.send_message(msg)
    return True


def notify_status_change(client_email, client_name, project_name, step_title, status):
    app_url = os.environ.get('APP_URL', 'https://sudosudev.com/app')
    label = STATUS_LABEL.get(status, status)
    subject = f"[sudosudev] {project_name} — update"
    body = (
        f"Hi {client_name},\n\n"
        f"An update on your project \"{project_name}\":\n\n"
        f"  • {step_title} → {label}\n\n"
        f"You can follow the full progress here:\n{app_url}/login\n\n"
        f"— sudosudev"
    )
    return send(client_email, subject, body)


def notify_admin_substep_done(client_name, client_email, project_name,
                              step_title, substep_title, client_note=''):
    """Email the admin when a client completes one of their substeps."""
    admin_to = os.environ.get('ADMIN_EMAIL') or os.environ.get('SMTP_USER')
    if not admin_to:
        print('[mail] no ADMIN_EMAIL set, skipping admin notify')
        return False
    subject = f"[sudosudev] {client_name} completed a task — {project_name}"
    body = (
        f"{client_name} ({client_email}) marked a sub-task as done.\n\n"
        f"  Project  : {project_name}\n"
        f"  Step     : {step_title}\n"
        f"  Task     : {substep_title}\n"
    )
    if client_note:
        body += f"\n  Client note:\n  \"{client_note}\"\n"
    body += "\n— sudosudev"
    return send(admin_to, subject, body)


def send_recovery_link(client_email, client_name, link, ttl_min=10):
    subject = "[sudosudev] Recover your access ID"
    body = (
        f"Hi {client_name},\n\n"
        f"You asked to regenerate your client ID.\n"
        f"Click the link below within {ttl_min} minutes to generate a new one:\n\n"
        f"{link}\n\n"
        f"If you didn't request this, just ignore this email — "
        f"your current ID stays valid.\n\n"
        f"— sudosudev"
    )
    return send(client_email, subject, body)


def send_new_client_id(client_email, client_name, client_id, app_url=None):
    app_url = app_url or os.environ.get('APP_URL', 'https://sudosudev.com/app')
    subject = "[sudosudev] Your new access ID"
    body = (
        f"Hi {client_name},\n\n"
        f"Here is your new client ID:\n\n"
        f"    {client_id}\n\n"
        f"Sign in here with your email and this ID:\n{app_url}/login\n\n"
        f"Note: your previous ID no longer works.\n\n"
        f"— sudosudev"
    )
    return send(client_email, subject, body)