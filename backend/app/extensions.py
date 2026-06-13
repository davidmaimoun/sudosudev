"""Shared singletons (db handle, cors). Imported by the app factory."""
import os
from pymongo import MongoClient
from flask_cors import CORS

cors = CORS()
_client = None
db = None


def init_db(app):
    global _client, db
    _client = MongoClient(app.config['MONGO_URI'])
    db = _client[app.config['DB_NAME']]
    # indexes (idempotent)
    db.clients.create_index('email', unique=True)
    db.admins.create_index('email', unique=True)
    return db
