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
