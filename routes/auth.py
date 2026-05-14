import os
import json
import datetime
import requests

from flask import Blueprint, jsonify, request, render_template
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import func, or_

from extensions import db
from models import Product, ProductChange, SyncLog, User, CartItem, Order, OrderItem, ActivityLog
from helpers import admin_required, log_activity, product_issue_summary, csv_response, product_snapshot, log_product_change

bp = Blueprint('auth', __name__)


@bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify(message='Username and password are required.'), 400

    if User.query.filter_by(username=username).first():
        return jsonify(message='Username already taken.'), 409

    user = User(username=username, role='user')
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify(message='User registered successfully.'), 201


@bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify(message='Username and password are required.'), 400

    user = User.query.filter_by(username=username).first()

    if user and not getattr(user, 'is_deleted', False) and user.check_password(password):
        login_user(user) # Flask-Login устанавливает сессию
        return jsonify(message='Logged in successfully.'), 200
    else:
        return jsonify(message='Invalid username or password.'), 401


@bp.route('/api/logout')
@login_required # Только авторизованные пользователи могут выйти
def logout():
    logout_user() # Flask-Login очищает сессию
    return jsonify(message='Logged out successfully.'), 200


@bp.route('/api/auth_status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            "is_authenticated": True,
            "user_id": current_user.id,
            "username": current_user.username,
            "role": getattr(current_user, "role", "user")
        })
    return jsonify({"is_authenticated": False})
