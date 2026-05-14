from .main import bp as main_bp
from .auth import bp as auth_bp
from .products import bp as products_bp
from .sync import bp as sync_bp
from .cart import bp as cart_bp
from .orders import bp as orders_bp
from .analytics import bp as analytics_bp
from .users import bp as users_bp
from .support import bp as support_bp
from .payments import bp as payments_bp


def register_blueprints(app):
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(sync_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(support_bp)
    app.register_blueprint(payments_bp)
