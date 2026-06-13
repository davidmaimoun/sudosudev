"""
Seed the dedicated 'sudosudev' DB with an admin + a demo client/projects.
Run from backend/:  python seed.py
Prints (and saves) the admin code + demo ClientID.
"""
import os
from datetime import datetime, timezone
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

from app.services.security import gen_client_id  # reuse the generator

load_dotenv()
DB_NAME = os.environ.get('DB_NAME', 'sudosudev')
db = MongoClient(os.environ.get('MONGO_URI', 'mongodb://localhost:27017'))[DB_NAME]

db.admins.delete_many({})
db.clients.delete_many({})
db.clients.create_index('email', unique=True)
db.admins.create_index('email', unique=True)

admin_code = '1234'   # ⚠ test only — use gen_admin_code() before production
db.admins.insert_one({
    'email': 'sudosudev@outlook.com', 'role': 'admin',
    'codeHash': generate_password_hash(admin_code),
    'createdAt': datetime.now(timezone.utc),
})

client_id = gen_client_id()
db.clients.insert_one({
    'name': 'Acme Bio Labs', 'email': 'demo@acme.bio', 'role': 'client',
    'clientIdHash': generate_password_hash(client_id),
    'createdAt': datetime.now(timezone.utc),
    'projects': [
        {'name': 'Genome Surveillance Pipeline',
         'description': 'End-to-end cgMLST pipeline for outbreak monitoring, deployed on GCP.',
         'steps': [
             {'title': 'Requirements & data audit',      'eta': '3 days', 'status': 'done'},
             {'title': 'Pipeline scaffold (Nextflow)',    'eta': '1 week', 'status': 'in_progress'},
             {'title': 'Allele calling + QC integration', 'eta': '1 week', 'status': 'todo'},
             {'title': 'Cloud deployment (GCP Batch)',    'eta': '4 days', 'status': 'todo'},
         ]},
        {'name': 'Results Dashboard',
         'description': 'Web app to explore runs, trees and reports.',
         'steps': [
             {'title': 'UX wireframes',  'eta': '2 days', 'status': 'done'},
             {'title': 'Frontend build', 'eta': '1 week', 'status': 'in_progress'},
         ]},
    ],
})

summary = (f"Seed complete on DB: {DB_NAME}\n{'-'*46}\n"
           f"ADMIN  email : sudosudev@outlook.com\nADMIN  code  : {admin_code}\n"
           f"CLIENT email : demo@acme.bio\nCLIENT id    : {client_id}\n{'-'*46}\n"
           f"Stored hashed — keep this file private (don't commit it).\n")
print('\n  ' + summary.replace('\n', '\n  '))
with open('seed-credentials.txt', 'w', encoding='utf-8') as f:
    f.write(summary)
print('  Saved to seed-credentials.txt\n')
