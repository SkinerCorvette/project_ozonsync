import datetime

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from sqlalchemy import func

from extensions import db
from models import User, CartItem
from helpers import admin_required, log_activity
from time_utils import app_now

bp = Blueprint('users_admin', __name__)

ALLOWED_ROLES = {'user', 'admin'}


def active_admin_count():
    return User.query.filter_by(role='admin', is_deleted=False).count()


@bp.route('/api/admin/users', methods=['GET'])
@login_required
@admin_required
def list_users():
    include_deleted = request.args.get('include_deleted', type=int, default=0) == 1
    query = User.query
    if not include_deleted:
        query = query.filter_by(is_deleted=False)
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [user.to_dict() for user in users]}), 200


@bp.route('/api/admin/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    role = data.get('role') or 'user'

    if not username:
        return jsonify({'message': 'Введите логин пользователя.'}), 400
    if len(username) > 80:
        return jsonify({'message': 'Логин слишком длинный. Максимум 80 символов.'}), 400
    if not password or len(password) < 4:
        return jsonify({'message': 'Пароль должен содержать не менее 4 символов.'}), 400
    if role not in ALLOWED_ROLES:
        return jsonify({'message': 'Некорректная роль пользователя.'}), 400
    if User.query.filter(func.lower(User.username) == username.lower()).first():
        return jsonify({'message': 'Пользователь с таким логином уже существует.'}), 409

    user = User(username=username, role=role, is_deleted=False)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    log_activity('user_create', 'user', f'Создана учётная запись {user.username} с ролью {user.role}', user.id)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    user = User.query.get(user_id)
    if not user or getattr(user, 'is_deleted', False):
        return jsonify({'message': 'Пользователь не найден.'}), 404

    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    role = data.get('role') or user.role

    if not username:
        return jsonify({'message': 'Введите логин пользователя.'}), 400
    if len(username) > 80:
        return jsonify({'message': 'Логин слишком длинный. Максимум 80 символов.'}), 400
    if role not in ALLOWED_ROLES:
        return jsonify({'message': 'Некорректная роль пользователя.'}), 400

    duplicate = User.query.filter(func.lower(User.username) == username.lower(), User.id != user.id).first()
    if duplicate:
        return jsonify({'message': 'Пользователь с таким логином уже существует.'}), 409

    if user.id == current_user.id and role != 'admin':
        return jsonify({'message': 'Нельзя изменить собственную роль администратора на пользователя.'}), 400

    if user.role == 'admin' and role != 'admin' and active_admin_count() <= 1:
        return jsonify({'message': 'Нельзя снять роль администратора с последней активной админ-учётки.'}), 400

    before_username = user.username
    before_role = user.role
    user.username = username
    user.role = role
    if password:
        if len(password) < 4:
            return jsonify({'message': 'Новый пароль должен содержать не менее 4 символов.'}), 400
        user.set_password(password)
    user.updated_at = app_now()

    password_note = ', пароль изменён' if password else ''
    log_activity(
        'user_update',
        'user',
        f'Изменена учётная запись {before_username}: логин {before_username} → {user.username}, роль {before_role} → {user.role}{password_note}',
        user.id
    )
    db.session.commit()
    return jsonify(user.to_dict()), 200


@bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user or getattr(user, 'is_deleted', False):
        return jsonify({'message': 'Пользователь не найден.'}), 404

    if user.id == current_user.id:
        return jsonify({'message': 'Нельзя удалить собственную учётную запись.'}), 400

    if user.role == 'admin' and active_admin_count() <= 1:
        return jsonify({'message': 'Нельзя удалить последнюю активную админ-учётку.'}), 400

    user.is_deleted = True
    user.deleted_at = app_now()
    user.updated_at = app_now()

    # Корзина удаляемого пользователя больше не нужна, но заказы и аудит остаются для истории.
    CartItem.query.filter_by(user_id=user.id).delete()

    log_activity('user_delete', 'user', f'Учётная запись {user.username} удалена администратором', user.id)
    db.session.commit()
    return jsonify({'message': 'Учётная запись удалена.'}), 200
