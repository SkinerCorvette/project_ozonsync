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

bp = Blueprint('cart', __name__)


@bp.route('/api/cart', methods=['GET'])
@login_required
def get_cart():
    items = CartItem.query.filter_by(user_id=current_user.id).order_by(CartItem.created_at.desc()).all()
    items_data = [item.to_dict() for item in items]
    total = round(sum(item['total_price'] for item in items_data if item.get('is_available')), 2)
    has_unavailable = any(not item.get('is_available') for item in items_data)
    return jsonify({"items": items_data, "total": total, "has_unavailable": has_unavailable}), 200


@bp.route('/api/cart', methods=['POST'])
@login_required
def add_to_cart():
    data = request.get_json() or {}
    offer_id = data.get('offer_id')
    quantity = data.get('quantity', 1)

    if not offer_id:
        return jsonify({"message": "offer_id обязателен."}), 400

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"message": "Количество должно быть целым числом."}), 400

    if quantity <= 0:
        return jsonify({"message": "Количество должно быть больше нуля."}), 400

    product = Product.query.filter_by(offer_id=offer_id, is_hidden=False).first()
    if not product:
        return jsonify({"message": "Товар не найден или недоступен для заказа."}), 404

    if product.stock is not None and product.stock < quantity:
        return jsonify({"message": "Недостаточно товара на остатке."}), 400

    item = CartItem.query.filter_by(user_id=current_user.id, product_id=product.id).first()
    if item:
        new_quantity = item.quantity + quantity
        if product.stock is not None and product.stock < new_quantity:
            return jsonify({"message": "Недостаточно товара на остатке."}), 400
        item.quantity = new_quantity
    else:
        item = CartItem(user_id=current_user.id, product_id=product.id, quantity=quantity)
        db.session.add(item)

    log_activity('cart_add', 'product', f'Товар {product.offer_id} добавлен в корзину', product.id)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.route('/api/cart/<int:item_id>', methods=['PUT'])
@login_required
def update_cart_item(item_id):
    data = request.get_json() or {}
    quantity = data.get('quantity')

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"message": "Количество должно быть целым числом."}), 400

    if quantity <= 0:
        return jsonify({"message": "Количество должно быть больше нуля."}), 400

    item = CartItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({"message": "Позиция корзины не найдена."}), 404

    if not item.product or item.product.is_hidden:
        return jsonify({"message": "Товар недоступен для заказа. Удалите его из корзины."}), 400

    if item.product.stock is not None and item.product.stock < quantity:
        return jsonify({"message": "Недостаточно товара на остатке."}), 400

    item.quantity = quantity
    db.session.commit()
    return jsonify(item.to_dict()), 200


@bp.route('/api/cart/<int:item_id>', methods=['DELETE'])
@login_required
def delete_cart_item(item_id):
    item = CartItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({"message": "Позиция корзины не найдена."}), 404

    db.session.delete(item)
    log_activity('cart_delete', 'cart_item', 'Товар удалён из корзины', item.id)
    db.session.commit()
    return jsonify({"message": "Товар удалён из корзины."}), 200
