import os
import json
import datetime
import requests

from flask import Blueprint, jsonify, request, render_template
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import func, or_

from extensions import db
from models import Product, ProductChange, SyncLog, User, CartItem, Order, OrderItem, ActivityLog, Payment
from helpers import admin_required, log_activity, product_issue_summary, csv_response, product_snapshot, log_product_change
from time_utils import app_now

bp = Blueprint('orders', __name__)


@bp.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    limit = request.args.get('limit', type=int, default=50)
    query = Order.query.order_by(Order.created_at.desc())

    if current_user.role != 'admin':
        query = query.filter_by(user_id=current_user.id)

    orders = query.limit(limit).all()
    return jsonify({"orders": [order.to_dict(include_items=True) for order in orders]}), 200


@bp.route('/api/orders', methods=['POST'])
@login_required
def create_order():
    data = request.get_json() or {}
    customer_name = (data.get('customer_name') or '').strip()
    customer_phone = (data.get('customer_phone') or '').strip()
    customer_comment = (data.get('customer_comment') or '').strip() or None
    payment_method = (data.get('payment_method') or 'test_card').strip()
    allowed_payment_methods = {'test_card', 'cash_on_delivery'}

    if payment_method not in allowed_payment_methods:
        return jsonify({"message": "Выберите корректный способ оплаты."}), 400

    if not customer_name:
        return jsonify({"message": "Введите имя покупателя."}), 400

    if not customer_phone:
        return jsonify({"message": "Введите телефон покупателя."}), 400

    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    if not cart_items:
        return jsonify({"message": "Корзина пуста."}), 400

    unavailable = []
    for cart_item in cart_items:
        product = cart_item.product
        if not product:
            unavailable.append("товар удалён из каталога")
        elif product.is_hidden:
            unavailable.append(f"{product.name} — товар недоступен для заказа в настоящее время")
        elif product.stock is not None and product.stock <= 0:
            unavailable.append(f"{product.name} — нет в наличии")
        elif product.stock is not None and product.stock < cart_item.quantity:
            unavailable.append(f"{product.name} — доступно {product.stock} шт., в корзине {cart_item.quantity} шт.")

    if unavailable:
        return jsonify({
            "message": "В корзине есть недоступные товары. Проверьте отмеченные позиции и повторите оформление.",
            "unavailable_items": unavailable,
        }), 400

    total_amount = 0
    order = Order(
        user_id=current_user.id,
        status='new',
        payment_method=payment_method,
        payment_status='cash_on_delivery' if payment_method == 'cash_on_delivery' else 'pending',
        total_amount=0,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_comment=customer_comment
    )
    db.session.add(order)
    db.session.flush()

    for cart_item in cart_items:
        product = cart_item.product
        price = float(product.price) if product.price is not None else 0
        item_total = round(price * cart_item.quantity, 2)
        total_amount += item_total

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            offer_id=product.offer_id,
            price=price,
            quantity=cart_item.quantity,
            total_price=item_total
        )
        db.session.add(order_item)

        if product.stock is not None:
            product.stock = max(product.stock - cart_item.quantity, 0)

        db.session.delete(cart_item)

    order.total_amount = round(total_amount, 2)
    payment = Payment(
        order_id=order.id,
        amount=order.total_amount,
        method=payment_method,
        provider='demo',
        status=order.payment_status,
        expires_at=(app_now() + datetime.timedelta(minutes=30)) if payment_method == 'test_card' else None,
    )
    db.session.add(payment)
    log_activity('order_create', 'order', f'Создан заказ №{order.id} на сумму {order.total_amount} ₽', order.id)
    log_activity('payment_create', 'payment', f'Создан платёж для заказа №{order.id}: {payment_method}', order.id)
    db.session.commit()
    return jsonify(order.to_dict(include_items=True)), 201


@bp.route('/api/orders/<int:order_id>', methods=['GET'])
@login_required
def get_order_detail(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"message": "Заказ не найден."}), 404

    if current_user.role != 'admin' and order.user_id != current_user.id:
        return jsonify({"message": "Недостаточно прав."}), 403

    return jsonify(order.to_dict(include_items=True)), 200



def _restore_order_stock(order):
    for item in order.items:
        product = Product.query.get(item.product_id) if item.product_id else None
        if product:
            current_stock = product.stock or 0
            product.stock = current_stock + int(item.quantity or 0)


def _cancel_or_refund_payments(order):
    now = app_now()
    if order.payment_status == 'paid':
        order.payment_status = 'refunded'
        target_status = 'refunded'
    else:
        order.payment_status = 'cancelled'
        target_status = 'cancelled'

    for payment in order.payments:
        if payment.status not in {'refunded', 'cancelled'}:
            payment.status = target_status
            payment.updated_at = now
            if target_status == 'refunded' and not payment.error_message:
                payment.error_message = 'Возврат отмечен при отмене заказа.'


@bp.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@login_required
@admin_required
def update_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"message": "Заказ не найден."}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    allowed_statuses = {'new', 'processing', 'confirmed', 'cancelled', 'completed'}

    if new_status not in allowed_statuses:
        return jsonify({"message": "Некорректный статус заказа."}), 400

    old_status = order.status
    order.status = new_status
    order.updated_at = app_now()

    if old_status != 'cancelled' and new_status == 'cancelled':
        _restore_order_stock(order)
        _cancel_or_refund_payments(order)

    log_activity('order_status_update', 'order', f'Статус заказа №{order.id}: {old_status} → {new_status}', order.id)
    db.session.commit()
    return jsonify(order.to_dict(include_items=True)), 200


@bp.route('/api/orders/<int:order_id>/cancel', methods=['PUT'])
@login_required
def cancel_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"message": "Заказ не найден."}), 404

    if current_user.role != 'admin' and order.user_id != current_user.id:
        return jsonify({"message": "Недостаточно прав."}), 403

    cancellable_statuses = {'new', 'processing'}
    if order.status not in cancellable_statuses:
        return jsonify({"message": "Этот заказ уже нельзя отменить."}), 400

    old_status = order.status
    order.status = 'cancelled'
    order.updated_at = app_now()

    _restore_order_stock(order)
    _cancel_or_refund_payments(order)

    log_activity('order_cancel', 'order', f'Заказ №{order.id} отменён пользователем', order.id)
    log_activity('order_status_update', 'order', f'Статус заказа №{order.id}: {old_status} → cancelled', order.id)
    db.session.commit()
    return jsonify(order.to_dict(include_items=True)), 200
