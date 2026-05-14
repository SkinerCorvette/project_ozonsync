import os

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS

from extensions import db, login_manager
from models import User
from sqlalchemy import inspect, text
from routes import register_blueprints


def ensure_lightweight_schema_updates():
    """Минимальные обновления схемы для уже созданной БД без отдельной системы миграций."""
    inspector = inspect(db.engine)
    if 'users' not in inspector.get_table_names():
        return

    columns = {column['name'] for column in inspector.get_columns('users')}
    dialect = db.engine.dialect.name

    def run(sql):
        try:
            db.session.execute(text(sql))
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            print(f"⚠️ Не удалось применить обновление схемы: {exc}")

    if 'is_deleted' not in columns:
        if dialect == 'mysql':
            run("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE")
        else:
            run("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0")

    if 'deleted_at' not in columns:
        run("ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL")

    if 'orders' in inspector.get_table_names():
        order_columns = {column['name'] for column in inspector.get_columns('orders')}
        if 'payment_status' not in order_columns:
            run("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'pending'")
        if 'payment_method' not in order_columns:
            run("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(30) NOT NULL DEFAULT 'test_card'")


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_HTTPONLY'] = True

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL',
        f'mysql+pymysql://{os.getenv("MYSQL_USER")}:{os.getenv("MYSQL_PASSWORD")}@{os.getenv("MYSQL_HOST")}/{os.getenv("MYSQL_DB")}'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SUPPORT_UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads', 'support')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    os.makedirs(app.config['SUPPORT_UPLOAD_FOLDER'], exist_ok=True)

    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:5500", "http://127.0.0.1:5500"]
    )

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'login'

    @login_manager.user_loader
    def load_user(user_id):
        user = User.query.get(int(user_id))
        if user and not getattr(user, 'is_deleted', False):
            return user
        return None

    @login_manager.unauthorized_handler
    def unauthorized():
        if request.path.startswith('/api/'):
            return jsonify(message='Unauthorized: Authentication required to access this resource.'), 401
        return jsonify(message='Unauthorized: Please log in.'), 401

    register_blueprints(app)

    with app.app_context():
        db.create_all()
        ensure_lightweight_schema_updates()
        print("Database tables created/updated (if they didn't exist).")

    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
