"""Application factory."""
from flask import Flask, jsonify
from dotenv import load_dotenv

from .config import Config
from .extensions import cors, init_db


def create_app(config_class=Config):
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(config_class)

    init_db(app)
    cors.init_app(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'])

    # blueprints
    from .routes.auth import bp as auth_bp
    from .routes.admin import bp as admin_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)

    @app.get('/api/health')
    def health():
        return jsonify(ok=True)

    return app
