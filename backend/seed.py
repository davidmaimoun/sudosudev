# -*- coding: utf-8 -*-
"""
Seed la base 'sudosudev' : 1 admin + le client Tataphone.
Lancer depuis backend/ :  python seed.py
Affiche (et enregistre) le code admin + le ClientID.
"""
import os
from datetime import datetime, timezone
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

from app.services.security import gen_client_id   # 2 lettres + 4 chiffres, sans tiret

load_dotenv()
DB_NAME = os.environ.get('DB_NAME', 'sudosudev')
db = MongoClient(os.environ.get('MONGO_URI', 'mongodb://localhost:27017'))[DB_NAME]

db.admins.delete_many({})
db.clients.delete_many({})
db.clients.create_index('email', unique=True)
db.admins.create_index('email', unique=True)

# ── admin ──
admin_code = 'sudosudevestunebombe'
db.admins.insert_one({
    'email': 'sudosudev@outlook.com', 'role': 'admin',
    'codeHash': generate_password_hash(admin_code),
    'createdAt': datetime.now(timezone.utc),
})

# ── client Tataphone ──
def step(title, status='todo', note='', needs_client=False):
    return {'title': title, 'eta': '', 'note': note,
            'needsClient': needs_client, 'status': status}

client_id = gen_client_id()
db.clients.insert_one({
    'name': 'Sacha Sebag',
    'email': 'sebagsacha@gmail.com',
    'role': 'client',
    'clientIdHash': generate_password_hash(client_id),
    'createdAt': datetime.now(timezone.utc),
    'projects': [
        {
            'name': 'Tataphone',
            'description': "Site e-commerce vendant des produits casher (smartphones, etc.) "
                           "et divers accessoires.",
            'steps': [
                step("Construire le squelette de l'app (React, Tailwind CSS et Flask)", 'done'),
                step("Créer un design basique puis ajouter quelques photos pour meubler le site", 'done'),
                step("Authentification + connexion Google", 'done'),
                step("Panneau d'administration", 'done'),
                step("Notifications par email + facturation", 'done'),
                step("Mise en ligne sur un serveur temporaire pour les tests", 'done'),
                step("Amélioration du design UI (commentaires, carrousel, bannières, etc.)", 'done'),
                step("Ajout de la connexion WhatsApp", 'done',
                     note="À vérifier : le bot via WhatsApp."),
                step("Mise en ligne sur le serveur final", 'in_progress',
                     note="Va sur hetzner.com → console → server, récupère l'IP, "
                          "puis configure le DNS de tataphone.co.il et www.tataphone.co.il "
                          "avec cette IP."),
                step("Upload des images produits (Cloudinary)", 'todo'),
                step("Traitement de l'Excel de Rudy — nettoyage du fichier pour l'import automatique",
                     'todo', needs_client=True,
                     note="C'est au client de réaliser cette étape."),
            ],
        },
    ],
})

summary = (f"Seed terminé — base : {DB_NAME}\n{'-'*48}\n"
           f"ADMIN  email : sudosudev@outlook.com\nADMIN  code  : {admin_code}\n"
           f"CLIENT email : sebagsacha@gmail.com\nCLIENT id    : {client_id}\n{'-'*48}\n"
           f"Stocké haché — garde ce fichier privé (ne pas committer).\n")
print('\n  ' + summary.replace('\n', '\n  '))
with open('seed-credentials.txt', 'w', encoding='utf-8') as f:
    f.write(summary)
print('  Enregistré dans seed-credentials.txt\n')