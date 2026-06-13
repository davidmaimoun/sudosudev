"""
check.py — diagnose the login 401.
Run from the backend/ folder (venv active):  python check.py
It bypasses Flask entirely and talks to MongoDB directly.
"""
import os
from pymongo import MongoClient
from werkzeug.security import check_password_hash
from dotenv import load_dotenv

load_dotenv()
uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
name = os.environ.get('DB_NAME', 'sudosudev')
db = MongoClient(uri)[name]

print("\n  MONGO_URI :", uri)
print("  DB_NAME   :", name)
print("  clients in this DB :", db.clients.count_documents({}))
print("  " + "-"*46)
for c in db.clients.find({}, {'email': 1, 'role': 1, 'name': 1}):
    print("   •", c.get('email'), "| role:", c.get('role'), "| name:", c.get('name'))
print("  " + "-"*46)

email = input("  Type the email you use to log in   : ").strip().lower()
cid   = input("  Type the ClientID you use to log in: ").strip().upper()

doc = db.clients.find_one({'email': email, 'role': 'client'})
print("\n  client found for that email :", bool(doc))
if doc:
    ok = check_password_hash(doc.get('clientIdHash', ''), cid)
    print("  ClientID matches            :", ok)
    if ok:
        print("\n  ✓ Credentials are VALID — login should work. If the page still")
        print("    fails, it's a front/origin issue, not the data.\n")
    else:
        print("\n  ✗ ClientID is wrong for this email. Use the value from")
        print("    seed-credentials.txt (the LAST seed run), or re-run seed.py.\n")
else:
    print("\n  ✗ No client with that email in DB '%s'." % name)
    print("    Either the seed ran on a different DB/Mongo, or the email differs.")
    print("    Check DB_NAME in .env matches the one the seed used.\n")
