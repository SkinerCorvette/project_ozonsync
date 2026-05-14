import json
import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from time_utils import app_now


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.BigInteger, unique=True, nullable=False)
    offer_id = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(512), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=True) 
    image_url = db.Column(db.String(1024), nullable=True)
    last_synced = db.Column(db.DateTime, nullable=False, default=app_now, onupdate=app_now)
    is_hidden = db.Column(db.Boolean, nullable=False, default=False)
    is_manual = db.Column(db.Boolean, nullable=False, default=False)
    source = db.Column(db.String(20), nullable=False, default='ozon')
    stock = db.Column(db.Integer, nullable=True)
    def __repr__(self):
        return f'<Product {self.offer_id} - {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': str(self.product_id), 
            'offer_id': self.offer_id,
            'name': self.name,
            'price': float(self.price) if self.price is not None else None,
            'image_url': self.image_url,
            'stock': self.stock,
            'is_hidden': self.is_hidden,
            'is_manual': self.is_manual,
            'last_synced': self.last_synced.isoformat() if self.last_synced else None,
            'source': self.source
        }

class ProductChange(db.Model):
    __tablename__ = 'product_changes'

    id = db.Column(db.Integer, primary_key=True)

    # Привязываем к товару по product.id (надёжно)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False, index=True)

    # Дублируем offer_id для удобного поиска (и если вдруг товар потом удалят физически)
    offer_id = db.Column(db.String(255), nullable=False, index=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    action = db.Column(db.String(50), nullable=False)  # create_local/update/delete/restore etc.
    changed_at = db.Column(db.DateTime, default=app_now, nullable=False)

    before_json = db.Column(db.Text, nullable=True)
    after_json = db.Column(db.Text, nullable=True)

    def to_dict(self):
        def parse_json(s):
            if not s:
                return None
            try:
                return json.loads(s)
            except Exception:
                return None

        return {
            "id": self.id,
            "product_id": self.product_id,
            "offer_id": self.offer_id,
            "user_id": self.user_id,
            "action": self.action,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None,
            "before": parse_json(self.before_json),
            "after": parse_json(self.after_json),
        }

class SyncLog(db.Model):
    __tablename__ = 'sync_logs'

    id = db.Column(db.Integer, primary_key=True)
    started_at = db.Column(db.DateTime, default=app_now, nullable=False)
    finished_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False)  
    updated_count = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def __repr__(self):
        return f'<SyncLog {self.id} status={self.status}>'

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    created_at = db.Column(db.DateTime, default=app_now)
    updated_at = db.Column(db.DateTime, default=app_now, onupdate=app_now)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    sync_logs = db.relationship('SyncLog', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Безопасное представление пользователя без хеша пароля."""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': bool(getattr(self, 'is_deleted', False)),
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
        }

    def __repr__(self):
        return f'<User {self.username}>'

class CartItem(db.Model):
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=app_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=app_now, onupdate=app_now, nullable=False)

    product = db.relationship('Product')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'product_id', name='uq_cart_user_product'),
    )

    def to_dict(self):
        product = self.product
        price = float(product.price) if product and product.price is not None else 0

        is_available = True
        unavailable_reason = None
        available_stock = None
        can_update_quantity = False

        if not product:
            is_available = False
            unavailable_reason = 'Товар удалён из каталога'
        else:
            available_stock = product.stock
            can_update_quantity = (not product.is_hidden) and (product.stock is None or product.stock > 0)
            if product.is_hidden:
                is_available = False
                unavailable_reason = 'Товар недоступен для заказа в настоящее время'
            elif product.stock is not None and product.stock <= 0:
                is_available = False
                unavailable_reason = 'Нет в наличии'
            elif product.stock is not None and product.stock < self.quantity:
                is_available = False
                unavailable_reason = f'Доступно только {product.stock} шт.'

        return {
            'id': self.id,
            'product_id': self.product_id,
            'offer_id': product.offer_id if product else None,
            'name': product.name if product else 'Товар удалён',
            'image_url': product.image_url if product else None,
            'price': price,
            'quantity': self.quantity,
            'total_price': round(price * self.quantity, 2),
            'is_available': is_available,
            'unavailable_reason': unavailable_reason,
            'available_stock': available_stock,
            'can_update_quantity': can_update_quantity,
        }

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(30), nullable=False, default='new')
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    customer_name = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(40), nullable=False)
    customer_comment = db.Column(db.Text, nullable=True)
    payment_status = db.Column(db.String(30), nullable=False, default='pending')
    payment_method = db.Column(db.String(30), nullable=False, default='test_card')
    created_at = db.Column(db.DateTime, default=app_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=app_now, onupdate=app_now, nullable=False)

    user = db.relationship('User')
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='order', lazy=True, cascade='all, delete-orphan', order_by='Payment.created_at.desc()')

    def latest_payment(self):
        return self.payments[0] if self.payments else None

    def to_dict(self, include_items=False):
        payment = self.latest_payment()
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'status': self.status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'payment': payment.to_dict() if payment else None,
            'total_amount': float(self.total_amount) if self.total_amount is not None else 0,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'customer_comment': self.customer_comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=True, index=True)
    product_name = db.Column(db.String(512), nullable=False)
    offer_id = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    total_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'offer_id': self.offer_id,
            'price': float(self.price) if self.price is not None else 0,
            'quantity': self.quantity,
            'total_price': float(self.total_price) if self.total_price is not None else 0,
        }


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    method = db.Column(db.String(30), nullable=False, default='test_card')
    provider = db.Column(db.String(40), nullable=False, default='demo')
    status = db.Column(db.String(30), nullable=False, default='pending')
    transaction_id = db.Column(db.String(80), nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=app_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=app_now, onupdate=app_now, nullable=False)
    paid_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'amount': float(self.amount) if self.amount is not None else 0,
            'method': self.method,
            'provider': self.provider,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
        }


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    action = db.Column(db.String(80), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=app_now, nullable=False)

    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(160), nullable=False)
    category = db.Column(db.String(80), nullable=False, default='other')
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='open')
    unread_for_admin = db.Column(db.Integer, nullable=False, default=1)
    unread_for_user = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=app_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=app_now, onupdate=app_now, nullable=False)
    closed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship('User')
    messages = db.relationship('SupportMessage', backref='ticket', lazy=True, cascade='all, delete-orphan', order_by='SupportMessage.created_at.asc()')
    attachments = db.relationship('SupportAttachment', backref='ticket', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_messages=False, viewer_role='user'):
        unread_count = self.unread_for_admin if viewer_role == 'admin' else self.unread_for_user
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'title': self.title,
            'category': self.category,
            'description': self.description,
            'status': self.status,
            'unread_count': unread_count,
            'unread_for_admin': self.unread_for_admin,
            'unread_for_user': self.unread_for_user,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
        }
        if include_messages:
            data['messages'] = [m.to_dict() for m in self.messages]
        return data


class SupportMessage(db.Model):
    __tablename__ = 'support_messages'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_tickets.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    body = db.Column(db.Text, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=app_now, nullable=False)

    user = db.relationship('User')
    attachments = db.relationship('SupportAttachment', backref='message', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'body': self.body or '',
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'attachments': [a.to_dict() for a in self.attachments],
        }


class SupportAttachment(db.Model):
    __tablename__ = 'support_attachments'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_tickets.id'), nullable=False, index=True)
    message_id = db.Column(db.Integer, db.ForeignKey('support_messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_url = db.Column(db.String(512), nullable=False)
    mime_type = db.Column(db.String(120), nullable=True)
    size_bytes = db.Column(db.Integer, nullable=False, default=0)
    uploaded_at = db.Column(db.DateTime, default=app_now, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'file_url': f'/api/support/attachments/{self.id}',
            'mime_type': self.mime_type,
            'size_bytes': self.size_bytes,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
