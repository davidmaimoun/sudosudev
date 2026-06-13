"""Entry point.  Dev: python run.py   |   Prod (gunicorn): run:app"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=8000)
